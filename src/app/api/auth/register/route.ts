// src/app/api/auth/register/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { IUser } from '@/types/definitions';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nombre, email y contraseña son requeridos.',
        },
        { status: 400 },
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'El email ya está en uso.' },
        { status: 409 },
      );
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Lógica para el primer usuario como Admin - por ahora desactivada
    const role = 'entrenador';
    const isActive = false;

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      isActive,
    });

    await newUser.save();

    // No devolver la contraseña en la respuesta
    const userResponse = newUser.toObject() as IUser & { password?: string };
    delete userResponse.password;

    return NextResponse.json(
      { success: true, data: userResponse },
      { status: 201 },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error en el servidor', error: errorMessage },
      { status: 500 },
    );
  }
}
