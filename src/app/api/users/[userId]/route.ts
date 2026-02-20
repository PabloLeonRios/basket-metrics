
// src/app/api/users/[userId]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { verifyAuth } from '@/lib/auth';

interface RouteContext {
    params: {
      userId: string;
    };
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  await dbConnect();
  const { userId } = params;
  
  try {
    const token = request.cookies.get('token')?.value;
    const verified = await verifyAuth(token);

    if (!verified.success || !verified.payload) {
      return NextResponse.json(verified, { status: 401 });
    }

    if (verified.payload.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Acceso denegado: Se requiere rol de Administrador.' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { isActive, teamId } = body;

    interface UpdatePayload {
      $set?: { isActive?: boolean; team?: string };
      $unset?: { team: string };
    }

    const updateData: UpdatePayload = {};
    updateData.$set = {};
    
    if (typeof isActive === 'boolean') {
      if (verified.payload.id === userId && isActive === false) {
        return NextResponse.json(
            { success: false, message: 'Un administrador no puede desactivar su propia cuenta.' },
            { status: 400 }
        );
      }
      updateData.$set.isActive = isActive;
    }

    if (typeof teamId === 'string') {
      if (teamId) {
        updateData.$set.team = teamId;
      } else {
        // Si el teamId es vacío, eliminamos la referencia del usuario
        updateData.$unset = { team: "" };
      }
    }

    if (Object.keys(updateData.$set).length === 0 && !updateData.$unset) {
      return NextResponse.json(
        { success: false, message: 'No se proporcionaron datos para actualizar.' },
        { status: 400 }
      );
    }
    
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, select: '-password' }
    ).populate('team');

    if (!updatedUser) {
        return NextResponse.json(
            { success: false, message: 'El usuario no fue encontrado.' },
            { status: 404 }
        );
    }

    return NextResponse.json({ success: true, data: updatedUser }, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error en el servidor al actualizar el usuario.', error: errorMessage },
      { status: 500 }
    );
  }
}
