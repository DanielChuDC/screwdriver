'use strict';

const boom = require('boom');
const joi = require('joi');
const schema = require('screwdriver-data-schema');
const idSchema = joi.reach(schema.models.token.base, 'id');

module.exports = () => ({
    method: 'DELETE',
    path: '/tokens/{id}',
    config: {
        description: 'Remove a single token',
        notes: 'Returns null if successful',
        tags: ['api', 'tokens'],
        auth: {
            strategies: ['token'],
            scope: ['user', '!guest']
        },
        plugins: {
            'hapi-swagger': {
                security: [{ token: [] }]
            }
        },
        handler: (request, reply) => {
            const { tokenFactory } = request.server.app;
            const { canAccess } = request.server.plugins.tokens;
            const { credentials } = request.auth;

            // Get the token first
            return tokenFactory
                .get(request.params.id)
                .then(token => {
                    if (!token) {
                        throw boom.notFound('Token does not exist.');
                    }

                    // Check that the user is deleting their own token
                    return canAccess(credentials, token).then(() => token.remove());
                })
                .then(() => reply().code(204))
                .catch(err => reply(boom.boomify(err)));
        },
        validate: {
            params: {
                id: idSchema
            }
        }
    }
});
