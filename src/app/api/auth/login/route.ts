// src/app/api/auth/login/route.ts
import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { IUser } from '@/types/definitions';
import { Document } from 'mongoose';
import bcrypt from 'bcrypt';
import * as jose from 'jose';
import { COOKIE_NAME, EXPIRATION_TIME, MAX_AGE_COOKIE } from '@/lib/constants';
import { JWT_SECRET } from '@/lib/auth-secret';

// Tipo local para informar a TypeScript que esperamos la contraseña aquí
type UserWithPassword = IUser & Document & { password?: string };

export async function POST(request: NextRequest) {
  await dbConnect();

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
    const token = await new jose.SignJWT({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      team: user.team,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(EXPIRATION_TIME)
      .sign(JWT_SECRET);

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
