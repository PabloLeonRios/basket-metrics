// src/app/api/users/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  await dbConnect();

  try {
    // 1. Verificar la autenticación y el rol del usuario
    const token = request.cookies.get('token')?.value;
    const verified = await verifyAuth(token);

    if (!verified.success || !verified.payload) {
      return NextResponse.json(verified, { status: 401 });
    }

    if (verified.payload.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Acceso denegado: Se requiere rol de Administrador.',
        },
        { status: 403 },
      );
    }

    // 2. Obtener todos los usuarios de la base de datos
    // Excluimos la contraseña del resultado por seguridad
    const users = await User.find({}).select('-password').populate('team');

    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      {
        success: false,
        message: 'Error en el servidor al obtener los usuarios.',
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
