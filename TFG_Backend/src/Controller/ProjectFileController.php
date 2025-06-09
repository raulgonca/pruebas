<?php

namespace App\Controller;

use App\Entity\ProjectFile;
use App\Entity\Repo;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use ZipArchive;
use Symfony\Component\HttpFoundation\StreamedResponse;

#[Route('/api', name: 'api_')]
class ProjectFileController extends AbstractController
{
    /**
     * Endpoint para descargar todos los ficheros de un proyecto en un ZIP.
     * GET /api/projects/{projectId}/files/download-zip
     */
    #[Route('/projects/{projectId}/files/download-zip', name: 'download_project_files_zip', methods: ['GET'])]
    public function downloadZip(Request $request, int $projectId, EntityManagerInterface $em): Response
    {
        try {
            // Verificar que la extensión zip está cargada
            if (!extension_loaded('zip')) {
                throw new \Exception('La extensión ZIP no está instalada o habilitada');
            }

            // Verificar que la clase ZipArchive existe
            if (!class_exists('ZipArchive')) {
                throw new \Exception('La clase ZipArchive no está disponible');
            }

            // Verificar autenticación (token en header o query param)
            $token = $request->query->get('token') ?? $request->headers->get('Authorization');
            if (!$token) {
                throw $this->createAccessDeniedException('No se proporcionó token de autenticación');
            }

            // Si el token viene en el header, quitar el prefijo 'Bearer '
            if (strpos($token, 'Bearer ') === 0) {
                $token = substr($token, 7);
            }

            // Verificar el token y obtener el usuario
            try {
                $user = $this->getUser();
                if (!$user instanceof User) {
                    throw $this->createAccessDeniedException('Token inválido o expirado');
                }
            } catch (\Exception $e) {
                throw $this->createAccessDeniedException('Token inválido o expirado');
            }

            // Busca el proyecto
            $project = $em->getRepository(\App\Entity\Repo::class)->find($projectId);
            if (!$project) {
                throw $this->createNotFoundException('Proyecto no encontrado');
            }

            // Verificar permisos (usuario debe ser propietario o colaborador)
            $isOwner = $user->getId() === $project->getOwner()->getId();
            $isCollaborator = $project->getColaboradores()->contains($user);
            if (!$isOwner && !$isCollaborator) {
                throw $this->createAccessDeniedException('No tienes permisos para descargar este proyecto');
            }

            // Busca los ficheros asociados al proyecto
            $files = $em->getRepository(\App\Entity\ProjectFile::class)->findBy(['project' => $project]);
            if (!$files || count($files) === 0) {
                return new Response('No hay ficheros para este proyecto', 404);
            }

            // El nombre del ZIP será el nombre del proyecto (limpio, sin espacios/conflictos)
            $projectName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $project->getProjectname());
            $zipFile = tempnam(sys_get_temp_dir(), 'project_files_') . '.zip';

            $zip = new ZipArchive();
            $result = $zip->open($zipFile, ZipArchive::CREATE);
            if ($result !== true) {
                throw new \Exception('No se pudo crear el archivo ZIP. Error: ' . $result);
            }

            // Añade cada fichero al ZIP
            foreach ($files as $file) {
                $filePath = $this->getParameter('kernel.project_dir') . '/public/FileRepos/' . $projectId . '/' . $file->getFileName();
                if (file_exists($filePath)) {
                    if (!$zip->addFile($filePath, $file->getOriginalName())) {
                        throw new \Exception('Error al añadir el archivo al ZIP: ' . $file->getOriginalName());
                    }
                }
            }

            $zip->close();

            // El ZIP se envía como descarga y luego se elimina del servidor
            $response = new StreamedResponse(function () use ($zipFile) {
                readfile($zipFile);
            });

            $zipDownloadName = $projectName . '_ficheros.zip';
            $response->headers->set('Content-Type', 'application/zip');
            $response->headers->set('Content-Disposition', 'attachment; filename="' . $zipDownloadName . '"');
            $response->headers->set('Content-Length', filesize($zipFile));

            // Elimina el ZIP temporal después de enviar la respuesta
            register_shutdown_function(function () use ($zipFile) {
                @unlink($zipFile);
            });

            return $response;

        } catch (\Exception $e) {
            // Log del error
            error_log('Error en downloadZip: ' . $e->getMessage());
            return new JsonResponse([
                'error' => 'Error al procesar el archivo ZIP',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    #[Route('/projects/{projectId}/files', name: 'upload_project_file', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function upload(Request $request, int $projectId, EntityManagerInterface $em): JsonResponse
    {
        $user = $this->getUser();
        $project = $em->getRepository(Repo::class)->find($projectId);
        if (!$project) {
            return new JsonResponse(['error' => 'Proyecto no encontrado'], Response::HTTP_NOT_FOUND);
        }

        $file = $request->files->get('file');
        if (!$file) {
            return new JsonResponse(['error' => 'No se ha enviado ningún archivo'], Response::HTTP_BAD_REQUEST);
        }

        $originalName = $file->getClientOriginalName(); // Esto incluye la extensión
        $safeName = uniqid() . '-' . $originalName;
        $projectDir = $this->getParameter('kernel.project_dir') . '/public/FileRepos/' . $projectId;
        if (!is_dir($projectDir)) {
            mkdir($projectDir, 0777, true);
        }
        $file->move($projectDir, $safeName);

        $projectFile = new ProjectFile();
        $projectFile->setUser($user);
        $projectFile->setProject($project);
        $projectFile->setFileName($safeName);
        $projectFile->setOriginalName($originalName); // Guarda el nombre completo con extensión
        $em->persist($projectFile);
        $em->flush();

        return new JsonResponse(['message' => 'Archivo subido correctamente', 'id' => $projectFile->getId()]);
    }

    #[Route('/projects/{projectId}/files', name: 'list_project_files', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function list(int $projectId, EntityManagerInterface $em): JsonResponse
    {
        $project = $em->getRepository(Repo::class)->find($projectId);
        if (!$project) {
            return new JsonResponse(['error' => 'Proyecto no encontrado'], Response::HTTP_NOT_FOUND);
        }
        $files = $em->getRepository(ProjectFile::class)->findBy(['project' => $project]);
        $data = [];
        foreach ($files as $file) {
            $data[] = [
                'id' => $file->getId(),
                'originalName' => $file->getOriginalName(),
                'fileName' => $file->getFileName(),
                'fechaSubida' => $file->getFechaSubida()->format('Y-m-d H:i'),
                'user' => [
                    'id' => $file->getUser()->getId(),
                    'username' => $file->getUser()->getUsername()
                ]
            ];
        }
        return new JsonResponse($data);
    }

    #[Route('/projects/{projectId}/files/{fileId}/download', name: 'download_project_file', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function download(int $projectId, int $fileId, EntityManagerInterface $em): Response
    {
        $file = $em->getRepository(ProjectFile::class)->find($fileId);
        if (!$file || $file->getProject()->getId() !== $projectId) {
            throw $this->createNotFoundException('Archivo no encontrado');
        }
        $filePath = $this->getParameter('kernel.project_dir') . '/public/FileRepos/' . $projectId . '/' . $file->getFileName();
        if (!file_exists($filePath)) {
            throw $this->createNotFoundException('Archivo no encontrado');
        }
        return (new BinaryFileResponse($filePath))
            ->setContentDisposition(ResponseHeaderBag::DISPOSITION_ATTACHMENT, $file->getOriginalName());
    }

    #[Route('/projects/{projectId}/files/{fileId}', name: 'delete_project_file', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function delete(int $projectId, int $fileId, EntityManagerInterface $em): JsonResponse
    {
        $file = $em->getRepository(ProjectFile::class)->find($fileId);
        if (!$file || $file->getProject()->getId() !== $projectId) {
            return new JsonResponse(['error' => 'Archivo no encontrado'], Response::HTTP_NOT_FOUND);
        }
        $filePath = $this->getParameter('kernel.project_dir') . '/public/FileRepos/' . $projectId . '/' . $file->getFileName();
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        $em->remove($file);
        $em->flush();
        return new JsonResponse(['message' => 'Archivo eliminado correctamente']);
    }

    #[Route('/projects/{projectId}/files/{fileId}/rename', name: 'rename_project_file', methods: ['PUT'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function rename(int $projectId, int $fileId, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $file = $em->getRepository(ProjectFile::class)->find($fileId);
        if (!$file || $file->getProject()->getId() !== $projectId) {
            return new JsonResponse(['error' => 'Archivo no encontrado'], Response::HTTP_NOT_FOUND);
        }
        $data = json_decode($request->getContent(), true);
        if (!isset($data['originalName']) || !trim($data['originalName'])) {
            return new JsonResponse(['error' => 'Nombre no válido'], Response::HTTP_BAD_REQUEST);
        }
        $file->setOriginalName($data['originalName']);
        $em->flush();
        return new JsonResponse(['message' => 'Nombre de archivo actualizado correctamente']);
    }
}
