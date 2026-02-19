// src/app/api/admin/users/[userId]/activate/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';

// Asumimos que el middleware ya ha verificado que el solicitante es un admin.

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    // Workaround: Extraer el ID desde la URL en lugar de usar el segundo argumento.
    const pathname = request.nextUrl.pathname;
    const parts = pathname.split('/');
    const userId = parts[parts.length - 2]; // La URL es /api/admin/users/[userId]/activate

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado' },
        { status: 404 },
      );
    }

    user.isActive = true;
    await user.save();

    const userResponse = user.toObject();

    return NextResponse.json(
      { success: true, data: userResponse },
      { status: 200 },
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
