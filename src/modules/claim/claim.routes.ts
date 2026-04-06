import { Hono } from 'hono';
import { getClaims, getClaim, postClaim, patchClaimStatus, putClaim } from './claim.controller.js';

const claimRoutes = new Hono();

claimRoutes.get('/', getClaims);                // GET    /api/claims?status=pending
claimRoutes.get('/:id', getClaim);              // GET    /api/claims/:id
claimRoutes.post('/', postClaim);               // POST   /api/claims
claimRoutes.patch('/:id/status', patchClaimStatus); // PATCH  /api/claims/:id/status
claimRoutes.put('/:id', putClaim);              // PUT    /api/claims/:id

export default claimRoutes;
