'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/dashboard');
    redirect('/dashboard');
}

export async function signup(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
            },
        },
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/dashboard');
    redirect('/dashboard');
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath('/');
    redirect('/');
}

export async function forgotPassword(formData: FormData) {
    const supabase = await createClient();
    const email = formData.get('email') as string;

    if (!email) {
        return { error: 'El correo electrónico es obligatorio.' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function resetPassword(formData: FormData) {
    const supabase = await createClient();
    const password = formData.get('password') as string;

    if (!password || password.length < 6) {
        return { error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/dashboard');
    redirect('/dashboard');
}
