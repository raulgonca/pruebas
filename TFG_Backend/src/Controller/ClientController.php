<?php

namespace App\Controller;

use App\Entity\Client;
use App\Repository\ClientRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\File\UploadedFile;

#[Route('/api', name: 'api_')]
final class ClientController extends AbstractController
{
    private $entityManager;
    private $clientRepository;

    public function __construct(EntityManagerInterface $entityManager, ClientRepository $clientRepository)
    {
        $this->entityManager = $entityManager;
        $this->clientRepository = $clientRepository;
    }

    #[Route('/clients', name: 'get_clients', methods: ['GET'])]
    public function getClients(): JsonResponse
    {
        $clients = $this->clientRepository->findAll();
        
        $clientsData = [];
        foreach ($clients as $client) {
            $clientsData[] = [
                'id' => $client->getId(),
                'name' => $client->getName(),
                'cif' => $client->getCif(),
                'email' => $client->getEmail(),
                'phone' => $client->getPhone(),
                'web' => $client->getWeb()
            ];
        }
        
        return new JsonResponse($clientsData);
    }

    #[Route('/clients/{id}', name: 'get_client', methods: ['GET'])]
    public function getClient(int $id): JsonResponse
    {
        $client = $this->clientRepository->find($id);
        
        if (!$client) {
            return new JsonResponse(['error' => 'Cliente no encontrado'], Response::HTTP_NOT_FOUND);
        }
        
        return new JsonResponse([
            'id' => $client->getId(),
            'name' => $client->getName(),
            'cif' => $client->getCif(),
            'email' => $client->getEmail(),
            'phone' => $client->getPhone(),
            'web' => $client->getWeb()
        ]);
    }

    #[Route('/createclient', name: 'create_client', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function createClient(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        if (!isset($data['name']) || !isset($data['cif'])) {
            return new JsonResponse(['error' => 'Faltan datos obligatorios'], Response::HTTP_BAD_REQUEST);
        }
        
        $client = new Client();
        $client->setName($data['name']);
        $client->setCif($data['cif']);
        
        if (isset($data['email'])) {
            $client->setEmail($data['email']);
        }
        
        if (isset($data['phone'])) {
            $client->setPhone($data['phone']);
        }
        
        if (isset($data['web'])) {
            $client->setWeb($data['web']);
        }
        
        $this->entityManager->persist($client);
        $this->entityManager->flush();
        
        return new JsonResponse([
            'id' => $client->getId(),
            'message' => 'Cliente creado con éxito'
        ], Response::HTTP_CREATED);
    }

    #[Route('/updateclient/{id}', name: 'update_client', methods: ['PUT'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function updateClient(Request $request, int $id): JsonResponse
    {
        $client = $this->clientRepository->find($id);

        if (!$client) {
            return new JsonResponse(['error' => 'Cliente no encontrado'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        // Comprobar si el nombre ya existe en otro cliente
        if (isset($data['name'])) {
            $existingName = $this->clientRepository->findOneBy(['name' => $data['name']]);
            if ($existingName && $existingName->getId() != $client->getId()) {
                return new JsonResponse(['error' => 'Ya existe un cliente con ese nombre'], Response::HTTP_CONFLICT);
            }
            $client->setName($data['name']);
        }

        // Comprobar si el CIF ya existe en otro cliente
        if (isset($data['cif'])) {
            $existingCif = $this->clientRepository->findOneBy(['cif' => $data['cif']]);
            if ($existingCif && $existingCif->getId() != $client->getId()) {
                return new JsonResponse(['error' => 'Ya existe un cliente con ese CIF'], Response::HTTP_CONFLICT);
            }
            $client->setCif($data['cif']);
        }

        if (isset($data['email'])) {
            $client->setEmail($data['email']);
        }
        
        if (isset($data['phone'])) {
            $client->setPhone($data['phone']);
        }
        
        if (isset($data['web'])) {
            $client->setWeb($data['web']);
        }
        
        $this->entityManager->flush();
        
        return new JsonResponse(['message' => 'Cliente actualizado con éxito']);
    }

    #[Route('/deleteclient/{id}', name: 'delete_client', methods: ['DELETE'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function deleteClient(int $id): JsonResponse
    {
        $client = $this->clientRepository->find($id);
        
        if (!$client) {
            return new JsonResponse(['error' => 'Cliente no encontrado'], Response::HTTP_NOT_FOUND);
        }
        
        $this->entityManager->remove($client);
        $this->entityManager->flush();
        
        return new JsonResponse(['message' => 'Cliente eliminado con éxito']);
    }

    /**
     * Exporta todos los clientes en formato CSV.
     * 
     * Funcionamiento:
     * - Cuando haces una petición GET a /api/clients/export,
     *   este endpoint genera un archivo CSV en tiempo real con todos los clientes de la base de datos.
     * - La primera fila es la cabecera (ID, Nombre, CIF, Email, Teléfono, Web).
     * - Cada fila siguiente es un cliente.
     * - El archivo se descarga automáticamente en el navegador.
     */
    #[Route('/clients/export', name: 'export_clients_csv', methods: ['GET'])]
    public function exportClientsCsv(): StreamedResponse
    {
        $response = new StreamedResponse();
        $response->setCallback(function () {
            $handle = fopen('php://output', 'w+');
            // Cabecera CSV
            fputcsv($handle, ['ID', 'Nombre', 'CIF', 'Email', 'Teléfono', 'Web']);
            foreach ($this->clientRepository->findAll() as $client) {
                fputcsv($handle, [
                    $client->getId(),
                    $client->getName(),
                    $client->getCif(),
                    $client->getEmail(),
                    $client->getPhone(),
                    $client->getWeb()
                ]);
            }
            fclose($handle);
        });
        $response->headers->set('Content-Type', 'text/csv; charset=utf-8');
        $response->headers->set('Content-Disposition', 'attachment; filename="clientes.csv"');
        return $response;
    }

    /**
     * Importa clientes desde un archivo CSV.
     * Soporta cabeceras flexibles (con o sin ID, y cualquier orden).
     * Guarda correctamente el campo phone aunque el CSV tenga cabecera 'phone' o 'teléfono'.
     */
    #[Route('/clients/import', name: 'import_clients_csv', methods: ['POST'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function importClientsCsv(Request $request): JsonResponse
    {
        try {
            /** @var UploadedFile $file */
            $file = $request->files->get('file');
            if (!$file) {
                return new JsonResponse([
                    'error' => 'No se ha enviado ningún archivo',
                    'code' => 'NO_FILE'
                ], Response::HTTP_BAD_REQUEST);
            }

            // Validar tipo de archivo
            if ($file->getClientMimeType() !== 'text/csv' && 
                $file->getClientOriginalExtension() !== 'csv') {
                return new JsonResponse([
                    'error' => 'El archivo debe ser un CSV',
                    'code' => 'INVALID_FILE_TYPE'
                ], Response::HTTP_BAD_REQUEST);
            }

            // Validar tamaño (máximo 1MB)
            if ($file->getSize() > 1024 * 1024) {
                return new JsonResponse([
                    'error' => 'El archivo es demasiado grande. Máximo 1MB permitido.',
                    'code' => 'FILE_TOO_LARGE'
                ], Response::HTTP_BAD_REQUEST);
            }

            $handle = fopen($file->getPathname(), 'r');
            if (!$handle) {
                return new JsonResponse([
                    'error' => 'No se pudo abrir el archivo',
                    'code' => 'FILE_OPEN_ERROR'
                ], Response::HTTP_BAD_REQUEST);
            }

            $header = fgetcsv($handle);
            if (!$header) {
                fclose($handle);
                return new JsonResponse([
                    'error' => 'El archivo está vacío o no tiene cabeceras',
                    'code' => 'EMPTY_FILE'
                ], Response::HTTP_BAD_REQUEST);
            }

            // Mapea las cabeceras a su índice (corrige posibles espacios y mayúsculas)
            $map = [];
            $requiredFields = ['nombre', 'cif'];
            $foundFields = [];

            foreach ($header as $i => $col) {
                $colNorm = strtolower(trim($col));
                if (in_array($colNorm, ['phone', 'teléfono', 'telefono'])) {
                    $map['phone'] = $i;
                } elseif (in_array($colNorm, ['nombre', 'name'])) {
                    $map['nombre'] = $i;
                    $foundFields[] = 'nombre';
                } elseif (in_array($colNorm, ['cif', 'c.i.f', 'taxid', 'tax_id'])) {
                    $map['cif'] = $i;
                    $foundFields[] = 'cif';
                } elseif (in_array($colNorm, ['email', 'correo', 'correo electrónico', 'e-mail'])) {
                    $map['email'] = $i;
                } elseif (in_array($colNorm, ['web', 'website', 'sitio web', 'pagina web', 'página web'])) {
                    $map['web'] = $i;
                }
            }

            // Verificar campos obligatorios
            $missingFields = array_diff($requiredFields, $foundFields);
            if (!empty($missingFields)) {
                fclose($handle);
                return new JsonResponse([
                    'error' => 'Faltan campos obligatorios en el CSV: ' . implode(', ', $missingFields),
                    'code' => 'MISSING_REQUIRED_FIELDS',
                    'missingFields' => $missingFields
                ], Response::HTTP_BAD_REQUEST);
            }

            $imported = 0;
            $skipped = 0;
            $errors = [];
            $lineNumber = 1; // Empezamos en 1 porque ya leímos la cabecera

            while (($row = fgetcsv($handle)) !== false) {
                $lineNumber++;
                try {
                    $name = isset($map['nombre']) ? trim($row[$map['nombre']]) : null;
                    $cif = isset($map['cif']) ? trim($row[$map['cif']]) : null;
                    $email = isset($map['email']) ? trim($row[$map['email']]) : null;
                    $phone = isset($map['phone']) ? trim($row[$map['phone']]) : null;
                    $web = isset($map['web']) ? trim($row[$map['web']]) : null;

                    if (!$name || !$cif) {
                        $errors[] = "Línea $lineNumber: Faltan campos obligatorios (Nombre o CIF)";
                        $skipped++;
                        continue;
                    }

                    // Evita duplicados por CIF
                    $existing = $this->clientRepository->findOneBy(['cif' => $cif]);
                    if ($existing) {
                        $errors[] = "Línea $lineNumber: Ya existe un cliente con el CIF $cif";
                        $skipped++;
                        continue;
                    }

                    $client = new Client();
                    $client->setName($name);
                    $client->setCif($cif);
                    $client->setEmail($email ?? '');
                    $client->setPhone($phone ?? '');
                    $client->setWeb($web ?? '');

                    $this->entityManager->persist($client);
                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = "Línea $lineNumber: " . $e->getMessage();
                    $skipped++;
                }
            }
            fclose($handle);

            // Intentar guardar todos los clientes válidos
            try {
                $this->entityManager->flush();
            } catch (\Exception $e) {
                return new JsonResponse([
                    'error' => 'Error al guardar los clientes en la base de datos',
                    'code' => 'DB_ERROR',
                    'details' => $e->getMessage()
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }

            return new JsonResponse([
                'message' => "Importación completada",
                'importados' => $imported,
                'omitidos' => $skipped,
                'errores' => $errors,
                'total_lineas' => $lineNumber - 1 // Restamos 1 por la cabecera
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Error al procesar el archivo CSV',
                'code' => 'PROCESSING_ERROR',
                'details' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
