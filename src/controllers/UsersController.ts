import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";

import { isValueEmpty, trimWhitespace } from "../utils/CommonUtils";
import { validateAPIKey, validateRequiredFields } from "../utils/ValidateUtils";
import { handleServerError } from "../utils/ErrorUtils";

import UserService from "../service/UserService";

type UserTypes = {
  email: string;
  password: string;
  name: string;
  role: string;
  last_op_id: string;
  created_timestamp?: Date;
  lastupdate_timestamp?: Date;
};

type newPassword = {
  oldPassword: string;
  newPassword1: string;
  newPassword2: string;
  last_op_id: string;
};

function UsersController() {
  const prisma = new PrismaClient();

  const {
    checkExistingUserValue,
    validateAddRole,
    getUserById,
    validatePasswordFields,
    validateLastOpUser,
    checkNameAndRole,
  } = UserService();

  //GET ALL
  const getAllUsers = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const isFoundHeader = validateAPIKey(
        request,
        reply,
        "get-user-header",
        "getUsersTest"
      );
      if (!isFoundHeader) return;

      const users = await prisma.uSERS.findMany();
      if (isValueEmpty(reply, users, "Category")) return;

      reply.send(users);
    } catch (error) {
      handleServerError(reply, error);
    }
  };

  //GET
  const getUser = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const isFoundHeader = validateAPIKey(
        request,
        reply,
        "get-user-header",
        "getUserTest"
      );
      if (!isFoundHeader) return;

      const { id } = request.params as { id: string };
      const user = await getUserById(reply, id);
      if (!user) return;

      reply.send({ data: user });
    } catch (error) {
      handleServerError(reply, error);
    }
  };

  //POST USER
  const addUser = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const isFoundHeader = validateAPIKey(
        request,
        reply,
        "add-user-header",
        "addUserTest"
      );
      if (!isFoundHeader) return;

      const { email, password, name, role, last_op_id } =
        request.body as UserTypes;

      const requiredFields = [email, password, name, role, last_op_id];
      if (!validateRequiredFields(reply, requiredFields)) return;

      const trimmedEmail = trimWhitespace(email);
      const trimmedName = trimWhitespace(name);
      const trimmedPassword = trimWhitespace(password);

      const isEmailUnique = await checkExistingUserValue(
        reply,
        "email",
        trimmedEmail
      );
      if (!isEmailUnique) return;

      const isNameUnique = await checkExistingUserValue(
        reply,
        "name",
        trimmedName
      );
      if (!isNameUnique) return;

      const isLastOpIdVal = await validateLastOpUser(reply, last_op_id, [
        "admin",
      ]);
      if (!isLastOpIdVal) return;

      const isRoleValid = validateAddRole(reply, role);
      if (!isRoleValid) return;

      const newUser = await prisma.uSERS.create({
        data: {
          email: trimmedEmail,
          password: trimmedPassword,
          name: trimmedName,
          role: role,
          last_op_id: last_op_id,
          created_timestamp: new Date(),
          lastupdate_timestamp: new Date(),
        },
      });

      reply.code(201).send(newUser);
    } catch (error) {
      handleServerError(reply, error);
    }
  };

  //PUT USER *check
  const updateUser = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const isFoundHeader = validateAPIKey(
        request,
        reply,
        "update-user-header",
        "updateUserTest"
      );
      if (!isFoundHeader) return;

      const { id } = request.params as { id: string };
      const user = await getUserById(reply, id);
      if (!user) return;

      const { name, role, last_op_id } = request.body as UserTypes;
      const trimmedName = trimWhitespace(name);

      const newName = name ? trimmedName : user.name;
      const newRole = role ? role : user.role;

      const isFoundNameAndRole = await checkNameAndRole(reply, name, role);
      if (!isFoundNameAndRole) return;

      const isLastOpIdVal = await validateLastOpUser(reply, last_op_id);
      if (!isLastOpIdVal) return;

      const updatedUser = await prisma.uSERS.update({
        where: {
          id: user.id,
        },
        data: {
          name: newName,
          role: newRole,
          last_op_id: last_op_id,
          lastupdate_timestamp: new Date(),
        },
      });

      reply.send(updatedUser);
    } catch (error) {
      handleServerError(reply, error);
    }
  };

  //PUT PASSWORD
  const editPassword = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const isFoundHeader = validateAPIKey(
        request,
        reply,
        "edit-password-header",
        "editPassword"
      );
      if (!isFoundHeader) return;

      const { id } = request.params as { id: string };
      const user = await getUserById(reply, id);
      if (!user) return;

      const { oldPassword, newPassword1, newPassword2, last_op_id } =
        request.body as newPassword;

      const trimmedOldPassword = trimWhitespace(oldPassword);
      const trimmedNewPassword1 = trimWhitespace(newPassword1);
      const trimmedNewPassword2 = trimWhitespace(newPassword2);

      const validatePassword = validatePasswordFields(
        reply,
        trimmedOldPassword,
        trimmedNewPassword1,
        trimmedNewPassword2,
        user.password
      );
      if (!validatePassword) return;

      const lastOpIdVal = validateLastOpUser(reply, last_op_id, ["admin"]);
      if (!lastOpIdVal) return;

      const newPassword = newPassword1 ? trimmedNewPassword1 : user.password;
      await prisma.uSERS.update({
        where: {
          id: id,
        },
        data: {
          password: newPassword,
          last_op_id: last_op_id,
          lastupdate_timestamp: new Date(),
        },
      });

      reply.send({ message: "Password updated successfully" });
    } catch (error) {
      handleServerError(reply, error);
    }
  };

  //DELETE
  const deleteUser = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const isFoundHeader = validateAPIKey(
        request,
        reply,
        "delete-user-header",
        "deleteUserTest"
      );
      if (!isFoundHeader) return;

      const { id } = request.params as { id: string };
      const user = await getUserById(reply, id);
      if (!user) return;

      await prisma.uSERS.delete({
        where: {
          id: id,
        },
      });

      reply.send({ message: "User deleted successfully" });
    } catch (error) {
      handleServerError(reply, error);
    }
  };

  return {
    getAllUsers,
    getUser,
    addUser,
    updateUser,
    editPassword,
    deleteUser,
  };
}

export default UsersController;
//is นำหน้าเป็น boolean

//basic auth
//Unit Test: Mocha
//Exception handling