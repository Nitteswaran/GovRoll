import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn("Supabase credentials missing in auth middleware.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email?: string;
    };
}

export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = {
            id: user.id,
            email: user.email
        };

        next();
    } catch (error) {
        console.error("Auth error:", error);
        return res.status(401).json({ error: 'Authentication failed' });
    }
};
