// src/app/api/auth/login/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Team from '@/lib/models/Team'; // Importar Team para que Mongoose lo registre para el populate
import { IUser } from '@/types/definitions';
import { Document } from 'mongoose';
import bcrypt from 'bcrypt';
import * as jose from 'jose';
import { COOKIE_NAME, EXPIRATION_TIME, MAX_AGE_COOKIE } from '@/lib/constants';
import { getJwtSecretKey } from '@/lib/auth-secret';

import { ITeam } from '@/types/definitions';

// Tipo local para informar a TypeScript que esperamos la contraseña aquí
type UserWithPassword = IUser & Document & { password?: string };
type PopulatedTeam = ITeam & { toObject: () => ITeam };

export async function POST(request: NextRequest) {
  await dbConnect();
  
  // Explicitly reference Team model to ensure it's registered by Mongoose
  // in serverless environments before the User.populate call.
  Team.exists({});

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email y contraseña son requeridos.' },
        { status: 400 },
      );
    }

    // Buscar al usuario, pedir la contraseña y hacer un cast al tipo local
    const user = (await User.findOne({ email })
      .select('+password')
      .populate('team')) as UserWithPassword;

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, message: 'Credenciales inválidas.' },
        { status: 401 },
      );
    }

    // Comprobar si la cuenta está activa
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Tu cuenta está pendiente de aprobación.' },
        { status: 403 },
      );
    }

    // Comparar la contraseña enviada con la hasheada en la BD
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Credenciales inválidas.' },
        { status: 401 },
      );
    }

    // --- Crear el JWT ---
    // Defensively serialize the team object to prevent errors with corrupted population
    const teamObject = user.team ? JSON.parse(JSON.stringify(user.team)) : undefined;

    const secret = getJwtSecretKey();
    const token = await new jose.SignJWT({
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      team: teamObject,
      createdAt: (user.createdAt as unknown as Date).toISOString(),
      updatedAt: (user.updatedAt as unknown as Date).toISOString(),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(EXPIRATION_TIME)
      .sign(secret);

    const userResponse = user.toObject();
    delete userResponse.password;

    // Crear la respuesta
    const response = NextResponse.json(
      { success: true, data: userResponse },
      { status: 200 },
    );

    // Guardar el token en una cookie HttpOnly en la respuesta
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: MAX_AGE_COOKIE,
      path: '/',
    });

    return response;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, message: 'Error en el servidor', error: errorMessage },
      { status: 500 },
    );
  }
}
