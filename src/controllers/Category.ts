import { PrismaClient } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";

import {
  handleServerError,
  isValueEmpty,
  validateAPIKey,
  validateRequiredFields,
} from "../utils/Utils";
import CategoryService from "../service/CategoryService";
import UserService from "../service/UserService";

type CategoryTypes = {
  name: string;
  last_op_id: string;
  created_timestamp?: Date;
  lastupdate_timestamp?: Date;
};

function Category() {
  const prisma = new PrismaClient();

  const { validateIdCategory, checkExistingCategoryValue } = CategoryService();
  const { validateLastOpUser } = UserService();

  //GET ALL
  const getAllCategory = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const isFoundHeader = validateAPIKey(
        request,
        reply,
        "header-get-category",
        "getCategoryTest"
      );
      if (!isFoundHeader) return;

      const category = await prisma.cATEGORY.findMany();
      if (isValueEmpty(reply, category, "Category")) return;

      reply.send(category);
    } catch (error) {
      handleServerError(reply, error);
    }
  };

  //GET
  const getCategory = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const isFoundHeader = validateAPIKey(
        request,
        reply,
        "header-get-category",
        "getCategoryTest"
      );
      if (!isFoundHeader) return;

      const { id } = request.params as { id: string };
      const category = await validateIdCategory(reply, id);
      if (!category) return;

      reply.send({ data: category });
    } catch (error) {
      handleServerError(reply, error);
    }
  };

  //POST
  const addCategory = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const isFoundHeader = validateAPIKey(
        request,
        reply,
        "header-add-category",
        "addCategoryTest"
      );
      if (!isFoundHeader) return;

      const { name, last_op_id } = request.body as CategoryTypes;

      const requiredFields = [name, last_op_id];
      if (!validateRequiredFields(reply, requiredFields)) return;

      const isNameUnique = await checkExistingCategoryValue(
        reply,
        "name",
        name
      );
      if (!isNameUnique) return;

      const isLastOpIdVal = await validateLastOpUser(reply, last_op_id);
      if (!isLastOpIdVal) return;

      const newCategory = await prisma.cATEGORY.create({
        data: {
          name,
          last_op_id,
          created_timestamp: new Date(),
          lastupdate_timestamp: new Date(),
        },
      });

      reply.code(201).send(newCategory);
    } catch (error) {
      handleServerError(reply, error);
    }
  };

  //PUT
  const updateCategory = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const isFoundHeader = validateAPIKey(
        request,
        reply,
        "header-update-category",
        "updateCategoryTest"
      );
      if (!isFoundHeader) return;

      const { id } = request.params as { id: string };
      const category = await validateIdCategory(reply, id);
      if (!category) return;

      const { name, last_op_id } = request.body as CategoryTypes;
      const requiredFields = [name, last_op_id];
      if (!validateRequiredFields(reply, requiredFields)) return;

      const isNameUnique = await checkExistingCategoryValue(
        reply,
        "name",
        name
      );
      if (!isNameUnique) return;

      const isLastOpIdVal = await validateLastOpUser(reply, last_op_id);
      if (!isLastOpIdVal) return;

      const updatedCategory = await prisma.cATEGORY.update({
        where: {
          id: id,
        },
        data: {
          name: name,
          last_op_id: last_op_id,
          lastupdate_timestamp: new Date(),
        },
      });

      const updatedItems = await prisma.cATEGORY.findMany();
      reply.send(updatedItems);
    } catch (error) {
      handleServerError(reply, error);
    }
  };

  //DELETE
  const deleteCategory = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const isFoundHeader = validateAPIKey(
        request,
        reply,
        "header-delete-category",
        "deleteCategoryTest"
      );
      if (!isFoundHeader) return;

      const { id } = request.params as { id: string };
      const category = await validateIdCategory(reply, id);
      if (!category) return;

      reply.send({ message: "Category deleted successfully" });
    } catch (error) {
      handleServerError(reply, error);
    }
  };

  return {
    getAllCategory,
    getCategory,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}

export default Category;