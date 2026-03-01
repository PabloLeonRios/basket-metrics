// src/app/api/users/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import '@/lib/models/Team'; // Ensure Team model is registered for populate
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

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const search = searchParams.get('search');

    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (teamId) {
      query.team = teamId;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // 2. Obtener el total de usuarios para la paginación
    const totalItems = await User.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);

    // 3. Obtener los usuarios de la base de datos
    const users = await User.find(query)
      .select('-password')
      .populate('team')
      .skip(skip)
      .limit(limit);

    return NextResponse.json(
      {
        success: true,
        data: users,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          limit,
        },
      },
      { status: 200 },
    );
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
