// src/app/api/auth/register/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { IUser } from '@/types/definitions';
import bcrypt from 'bcrypt';
import { verifyAuth } from '@/lib/auth';
import { isPasswordStrong, passwordPolicyMessage } from '@/lib/password-policy';

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const body = await request.json();
    const { name, email, password, role: requestedRole, teamId } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Nombre, email y contraseña son requeridos.' }, { status: 400 });
    }

    if (!isPasswordStrong(password)) {
      return NextResponse.json({ success: false, message: passwordPolicyMessage }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'El email ya está en uso.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let role = 'entrenador';
    let isActive = false;
    let finalTeamId = null;

    // Check if an admin is making the request
    const token = request.cookies.get('token')?.value;
    if (token) {
        const { payload } = await verifyAuth(token);
        if (payload && payload.role === 'admin') {
            // Admin is creating user, allow setting role, team and activating immediately
            role = requestedRole === 'admin' ? 'admin' : 'entrenador';
            isActive = true;
            if (teamId) {
                finalTeamId = teamId;
            }
        }
    }

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      isActive,
      team: finalTeamId,
    });

    await newUser.save();

    const userResponse = newUser.toObject() as IUser & { password?: string };
    delete userResponse.password;

    return NextResponse.json({ success: true, data: userResponse }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, message: 'Error en el servidor', error: errorMessage }, { status: 500 });
  }
}
