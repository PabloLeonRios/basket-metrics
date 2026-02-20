
// src/app/api/teams/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Team from '@/lib/models/Team';
import User from '@/lib/models/User';
import { verifyAuth } from '@/lib/auth';

// GET: Obtener todos los equipos
export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    const token = request.cookies.get('token')?.value;
    const verified = await verifyAuth(token);
    if (!verified.success) {
        return NextResponse.json(verified, { status: 401 });
    }

    const teams = await Team.find({}).sort({ name: 1 });
    return NextResponse.json({ success: true, data: teams }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error al obtener los equipos.', error: errorMessage },
      { status: 500 }
    );
  }
}

// POST: Crear un nuevo equipo (Solo para Admins)
export async function POST(request: NextRequest) {
  await dbConnect();
  try {
    const token = request.cookies.get('token')?.value;
    const verified = await verifyAuth(token);
    if (!verified.success || !verified.payload) {
        return NextResponse.json(verified, { status: 401 });
    }
    if (verified.payload.role !== 'admin') {
        return NextResponse.json(
            { success: false, message: 'Acceso denegado. Se requiere rol de Administrador.' },
            { status: 403 }
        );
    }
    
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json(
        { success: false, message: 'El nombre del equipo es requerido.' },
        { status: 400 }
      );
    }

    const newTeam = new Team({ name });
    await newTeam.save();

    return NextResponse.json({ success: true, data: newTeam }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && (error as {code: unknown}).code === 11000) {
        return NextResponse.json(
          { success: false, message: 'Ya existe un equipo con ese nombre.' },
          { status: 409 }
        );
    }
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error al crear el equipo.', error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT: Actualizar un equipo
export async function PUT(request: NextRequest) {
    await dbConnect();
    try {
        const token = request.cookies.get('token')?.value;
        const verified = await verifyAuth(token);
        if (!verified.success || !verified.payload) { return NextResponse.json(verified, { status: 401 }); }
        if (verified.payload.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Acceso denegado.' }, { status: 403 });
        }

        const teamId = request.nextUrl.searchParams.get('teamId');
        if (!teamId) {
            return NextResponse.json({ success: false, message: 'El teamId es requerido.' }, { status: 400 });
        }
        
        const { name } = await request.json();
        if (!name) {
            return NextResponse.json({ success: false, message: 'El nombre es requerido.' }, { status: 400 });
        }
    
        const updatedTeam = await Team.findByIdAndUpdate(teamId, { name }, { new: true, runValidators: true });
    
        if (!updatedTeam) {
            return NextResponse.json({ success: false, message: 'Equipo no encontrado.' }, { status: 404 });
        }
    
        return NextResponse.json({ success: true, data: updatedTeam }, { status: 200 });
    } catch (error) {
        if (error instanceof Error && error.name === 'MongoServerError' && 'code' in error && (error as {code: unknown}).code === 11000) {
            return NextResponse.json({ success: false, message: 'Ya existe un equipo con ese nombre.' }, { status: 409 });
        }
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        return NextResponse.json({ success: false, message: 'Error al actualizar el equipo.', error: errorMessage }, { status: 500 });
    }
}

// DELETE: Eliminar un equipo
export async function DELETE(request: NextRequest) {
    await dbConnect();
    try {
        const token = request.cookies.get('token')?.value;
        const verified = await verifyAuth(token);
        if (!verified.success || !verified.payload) { return NextResponse.json(verified, { status: 401 }); }
        if (verified.payload.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Acceso denegado.' }, { status: 403 });
        }

        const teamId = request.nextUrl.searchParams.get('teamId');
        if (!teamId) {
            return NextResponse.json({ success: false, message: 'El teamId es requerido.' }, { status: 400 });
        }

        const deletedTeam = await Team.findByIdAndDelete(teamId);
    
        if (!deletedTeam) {
            return NextResponse.json({ success: false, message: 'Equipo no encontrado.' }, { status: 404 });
        }

        await User.updateMany({ team: teamId }, { $unset: { team: "" } });
    
        return NextResponse.json({ success: true, message: 'Equipo eliminado correctamente.' }, { status: 200 });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        return NextResponse.json({ success: false, message: 'Error al eliminar el equipo.', error: errorMessage }, { status: 500 });
    }
}
