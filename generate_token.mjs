
    import * as jose from "jose";

    async function run() {
        const secret = new TextEncoder().encode('secreto_inseguro_por_defecto_para_dev');
        const token = await new jose.SignJWT({
            _id: '123456789012345678901234',
            email: 'coach@test.com',
            name: 'Test Coach',
            role: 'entrenador',
            isActive: true,
            team: { _id: 'team123', name: 'My Team' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);

        console.log(token);
    }
    run();
