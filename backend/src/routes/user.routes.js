'use strict';

const express = require('express');
const router = express.Router();
const { getUsers, getUserById, createUser, updateUser, updateUserStatus, deleteUser } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createUserSchema, updateUserSchema } = require('../validators/user.validator');
const Joi = require('joi');

const statusSchema = Joi.object({ isActive: Joi.boolean().required() });

router.use(authenticate, authorize('users', 'read'));

router.get('/', getUsers);
router.post('/', authorize('users', 'create'), validate(createUserSchema), createUser);
router.get('/:id', getUserById);

// Full update (PUT) and partial update (PATCH) both use updateUser
router.put('/:id', authorize('users', 'update'), validate(updateUserSchema), updateUser);
router.patch('/:id', authorize('users', 'update'), validate(updateUserSchema), updateUser);

// Status toggle
router.patch('/:id/status', authorize('users', 'update'), validate(statusSchema), updateUserStatus);

// Soft delete
router.delete('/:id', authorize('users', 'delete'), deleteUser);

module.exports = router;
