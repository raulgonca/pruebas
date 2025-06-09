<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class RegistrationController extends AbstractController
{
    private EntityManagerInterface $entityManager;
    private UserRepository $userRepository;
    private UserPasswordHasherInterface $passwordHasher;
    private ValidatorInterface $validator;

    public function __construct(
        EntityManagerInterface $entityManager,
        UserRepository $userRepository,
        UserPasswordHasherInterface $passwordHasher,
        ValidatorInterface $validator
    ) {
        $this->entityManager = $entityManager;
        $this->userRepository = $userRepository;
        $this->passwordHasher = $passwordHasher;
        $this->validator = $validator;
    }

    /**
     * Registra un nuevo usuario a través de la API
     */
    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function apiRegister(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        // Validar que los campos requeridos estén presentes
        if (!isset($data['email']) || !isset($data['username']) || !isset($data['password'])) {
            return new JsonResponse(['message' => 'Faltan campos obligatorios (email, username, password)'], Response::HTTP_BAD_REQUEST);
        }
        
        // Validar formato de email
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return new JsonResponse(['message' => 'El formato del email no es válido'], Response::HTTP_BAD_REQUEST);
        }
        
        // Verificar si el email ya existe
        if ($this->userRepository->findOneBy(['email' => $data['email']])) {
            return new JsonResponse(['message' => 'El email ya está en uso'], Response::HTTP_CONFLICT);
        }
        
        // Verificar si el username ya existe
        if ($this->userRepository->findOneBy(['username' => $data['username']])) {
            return new JsonResponse(['message' => 'El nombre de usuario ya está en uso'], Response::HTTP_CONFLICT);
        }
        
        // Crear nuevo usuario
        $user = new User();
        $user->setEmail($data['email']);
        $user->setUsername($data['username']);
        $user->setRoles(['ROLE_USER']);
        
        // Encriptar la contraseña usando el servicio de Symfony
        $hashedPassword = $this->passwordHasher->hashPassword($user, $data['password']);
        $user->setPassword($hashedPassword);
        
        // Validar la entidad User con constraints de Symfony
        $errors = $this->validator->validate($user);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getPropertyPath() . ': ' . $error->getMessage();
            }
            return new JsonResponse(['message' => 'Errores de validación', 'errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }
        
        try {
            $this->entityManager->persist($user);
            $this->entityManager->flush();
            
            // Crear un array con los datos del usuario
            $userData = [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'username' => $user->getUsername()
            ];
            
            return new JsonResponse([
                'message' => 'Usuario registrado con éxito',
                'user' => $userData
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return new JsonResponse(['message' => 'Error al registrar el usuario: ' . $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

}