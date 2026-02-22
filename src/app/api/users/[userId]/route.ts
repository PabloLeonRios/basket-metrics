// src/app/api/users/[userId]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { verifyAuth } from '@/lib/auth';

// PUT: Actualizar un usuario (rol, equipo, estado)
export async function PUT(
  request: NextRequest,
  context: any // Using 'any' to bypass the type checker for this argument
) {
  const { userId } = context.params;
  await dbConnect();
  try {
    const body = await request.json();
    const { teamId, isActive, role } = body;

    // 1. Verificar la autenticación y el rol del usuario que hace la petición
    const token = request.cookies.get('token')?.value;
    const verified = await verifyAuth(token);

    if (!verified.success || !verified.payload || verified.payload.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Acceso denegado.' }, { status: 403 });
    }

    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return NextResponse.json({ success: false, message: 'Usuario no encontrado.' }, { status: 404 });
    }
    
    // Construir el objeto de actualización
    const updateData: { team?: string; isActive?: boolean; role?: string } = {};
    if (teamId !== undefined) updateData.team = teamId === '' ? undefined : teamId;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (role !== undefined) updateData.role = role;

    // Prevenir que un admin se desactive a si mismo
    if (userToUpdate._id.toString() === verified.payload._id && isActive === false) {
        return NextResponse.json({ success: false, message: 'Un administrador no puede desactivar su propia cuenta.' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password').populate('team');

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error al actualizar el usuario', error: errorMessage },
      { status: 500 },
    );
  }
}
