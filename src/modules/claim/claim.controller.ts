import type { Context } from 'hono';
import { findAllClaims, findClaimById, createClaim, updateClaimStatus, updateClaim } from './claim.model.js';

export const getClaims = async (c: Context) => {
    try {
        const status = c.req.query('status');
        const claims = await findAllClaims(status);
        return c.json(claims, 200);
    } catch (error) {
        return c.json({ message: 'Failed to fetch claims' }, 500);
    }
};

export const getClaim = async (c: Context) => {
    try {
        const id = Number(c.req.param('id'));
        const claim = await findClaimById(id);

        if (!claim) {
            return c.json({ message: 'Claim not found' }, 404);
        }

        return c.json(claim, 200);
    } catch (error) {
        return c.json({ message: 'Failed to fetch claim' }, 500);
    }
};

export const postClaim = async (c: Context) => {
    try {
        const body = await c.req.json();
        const { item_id, claimant_name, claimant_email, proof_text } = body;

        if (!item_id || !claimant_name || !claimant_email) {
            return c.json({ message: 'item_id, claimant_name, and claimant_email are required' }, 400);
        }

        const result: any = await createClaim({ item_id, claimant_name, claimant_email, proof_text });

        return c.json({
            message: 'Claim submitted successfully',
            claim: { id: result.insertId, item_id, claimant_name, claimant_email, proof_text, status: 'pending' }
        }, 201);
    } catch (error) {
        return c.json({ message: 'Failed to submit claim' }, 500);
    }
};

export const patchClaimStatus = async (c: Context) => {
    try {
        const id = Number(c.req.param('id'));
        const { status } = await c.req.json();

        if (!['pending', 'verified', 'rejected'].includes(status)) {
            return c.json({ message: 'Status must be pending, verified, or rejected' }, 400);
        }

        const existing = await findClaimById(id);
        if (!existing) {
            return c.json({ message: 'Claim not found' }, 404);
        }

        await updateClaimStatus(id, status);
        return c.json({ message: `Claim ${status} successfully` }, 200);
    } catch (error) {
        return c.json({ message: 'Failed to update claim status' }, 500);
    }
};

export const putClaim = async (c: Context) => {
    try {
        const id = Number(c.req.param('id'));
        const body = await c.req.json();

        const existing = await findClaimById(id);
        if (!existing) {
            return c.json({ message: 'Claim not found' }, 404);
        }

        await updateClaim(id, body);
        const updated = await findClaimById(id);

        return c.json({ message: 'Claim updated successfully', claim: updated }, 200);
    } catch (error) {
        return c.json({ message: 'Failed to update claim' }, 500);
    }
};
