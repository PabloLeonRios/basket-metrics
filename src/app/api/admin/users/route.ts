// src/app/api/admin/users/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  await dbConnect();

  // Asumimos que el middleware ya ha protegido esta ruta y ha verificado
  // que el usuario tiene el rol 'admin'.

  try {
    // Obtenemos todos los usuarios, excluyendo sus contraseñas
    const users = await User.find({}).select('-password');
    return NextResponse.json({ success: true, data: users }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error en el servidor', error: errorMessage },
      { status: 500 },
    );
  }
}
