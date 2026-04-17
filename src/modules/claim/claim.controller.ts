import type { Context } from 'hono';
import { findAllClaims, findClaimById, createClaim, updateClaimStatus, updateClaim, removeClaim } from './claim.model.js';
import { updateItem as updateItemModel } from '../item/item.model.js';
import { io } from '../../index.js';

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
        const { item_id, claimant_name, claimant_email, proof_text, evidence_image_url } = body;

        if (!item_id || !claimant_name || !claimant_email) {
            return c.json({ message: 'item_id, claimant_name, and claimant_email are required' }, 400);
        }

        const result: any = await createClaim({ item_id, claimant_name, claimant_email, proof_text, evidence_image_url });
        
        // Fetch the full claim object with item details for real-time notification
        const fullClaim = await findClaimById(result.insertId);

        // Emit real-time event
        io.emit('new_claim', fullClaim);

        return c.json({
            message: 'Claim submitted successfully',
            claim: fullClaim
        }, 201);
    } catch (error) {
        console.error('Error in postClaim:', error);
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

        // If verified, automatically mark the item as Settled
        if (status === 'verified' && existing.item_id) {
            await updateItemModel(existing.item_id, { status: 'Settled' });
            io.emit('item_updated', { id: existing.item_id, status: 'Settled' });
        }

        // Emit real-time event
        io.emit('claim_status_updated', { id, status });

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

        // Map camelCase (from frontend) to snake_case (for DB model)
        const updateData: any = {};
        if (body.proofText   !== undefined) updateData.proof_text      = body.proofText;
        if (body.proof_text  !== undefined) updateData.proof_text      = body.proof_text;
        if (body.claimantName !== undefined) updateData.claimant_name  = body.claimantName;
        if (body.claimantEmail !== undefined) updateData.claimant_email = body.claimantEmail;
        if (body.evidenceImageUrl !== undefined) updateData.evidence_image_url = body.evidenceImageUrl;

        await updateClaim(id, updateData);
        const updated = await findClaimById(id);

        return c.json({ message: 'Claim updated successfully', claim: updated }, 200);
    } catch (error) {
        console.error('Error in putClaim:', error);
        return c.json({ message: 'Failed to update claim' }, 500);
    }
};

export const deleteClaim = async (c: Context) => {
    try {
        const id = Number(c.req.param('id'));

        const existing = await findClaimById(id);
        if (!existing) {
            return c.json({ message: 'Claim not found' }, 404);
        }

        await removeClaim(id);
        return c.json({ message: 'Claim deleted successfully' }, 200);
    } catch (error) {
        return c.json({ message: 'Failed to delete claim' }, 500);
    }
};