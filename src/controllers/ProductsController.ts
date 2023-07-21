import { FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";

import { isValueEmpty } from "../utils/CommonUtils";
import { validateAPIKey } from "../utils/ValidateUtils";
import { handleServerError } from "../utils/ErrorUtils";

import UserService from "../service/UserService";
import ProductService from "../service/ProductService";
import CategoryService from "../service/CategoryService";

type ProductsTypes = {
  name: string;
  category_id: string;
  price: number;
  quantity: number;
  last_op_id: string;
  created_timestamp?: Date;
  lastupdate_timestamp?: Date;
};

function ProductsController() {
  const prisma = new PrismaClient();

  const { getProductById, checkExistingProductValue, validateBodyValue } =
    ProductService();
  const { validateLastOpUser } = UserService();
  const { getCategoryById } = CategoryService();

  //GET ALL
  const getAllProducts = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const isFoundHeader = validateAPIKey(
        request,
        reply,
        "header-get-products",
        "getProductsTest"
      );
      if (!isFoundHeader) return;

      const products = await prisma.pRODUCTS.findMany();
      if (isValueEmpty(reply, products, "Products")) return;

      reply.send(products);
    } catch (error) {
      handleServerError(reply, error);
    }
  };

  //GET PRODUCT
  const getProduct = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const isFoundHeader = validateAPIKey(
        request,
        reply,
        "header-get-products",
        "getProductsTest"
      );
      if (!isFoundHeader) return;

      const { id } = request.params as { id: string };
      const product = await getProductById(reply, id);
      if (!product) return;

      reply.send({ data: product });
    } catch (error) {
      handleServerError(reply, error);
    }
  };

  //POST
  const addProduct = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const isFoundHeader = validateAPIKey(
        request,
        reply,
        "header-add-product",
        "addProductTest"
      );
      if (!isFoundHeader) return;

      const { name, category_id, price, quantity, last_op_id } =
        request.body as ProductsTypes;
      const requiredFields = [name, category_id, last_op_id];

      if (!validateBodyValue(reply, requiredFields, price, quantity)) return;

      const isCategoryId = await getCategoryById(reply, category_id);
      if (!isCategoryId) return;

      const isLastOpIdVal = await validateLastOpUser(reply, last_op_id);
      if (!isLastOpIdVal) return;

      const newProduct = await prisma.pRODUCTS.create({
        data: {
          name,
          category_id,
          price,
          quantity,
          last_op_id,
          created_timestamp: new Date(),
          lastupdate_timestamp: new Date(),
        },
      });

      reply.code(201).send(newProduct);
    } catch (error) {
      handleServerError(reply, error);
    }
  };

  //UPDATE
  const updateProduct = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const isFoundHeader = validateAPIKey(
        request,
        reply,
        "header-update-product",
        "updateProductTest"
      );
      if (!isFoundHeader) return;

      const { id } = request.params as { id: string };
      const product = await getProductById(reply, id);
      if (!product) return;

      const { name, category_id, price, quantity, last_op_id } =
        request.body as ProductsTypes;

      const newName = name ?? product.name;
      const newCategoryId = category_id ?? product.category_id;
      const newPrice = price ?? product.price;
      const newQuantity = quantity ?? product.quantity;

      const isLastOpIdVal = await validateLastOpUser(reply, last_op_id);
      if (!isLastOpIdVal) return;

      const updateProduct = await prisma.pRODUCTS.update({
        where: {
          id: product.id,
        },
        data: {
          name: newName,
          category_id: newCategoryId,
          price: newPrice,
          quantity: newQuantity,
          last_op_id: last_op_id,
          lastupdate_timestamp: new Date(),
        },
      });

      reply.send(updateProduct);
    } catch (error) {
      handleServerError(reply, error);
    }
  };

  //DELETE
  const deleteProduct = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const isFoundHeader = validateAPIKey(
        request,
        reply,
        "header-delete-product",
        "deleteProductTest"
      );
      if (!isFoundHeader) return;

      const { id } = request.params as { id: string };
      const product = await getProductById(reply, id);
      if (!product) return;

      await prisma.pRODUCTS.delete({
        where: {
          id: id,
        },
      });

      reply.send({ message: "Product deleted successfully" });
    } catch (error) {
      handleServerError(reply, error);
    }
  };

  return {
    getAllProducts,
    getProduct,
    addProduct,
    updateProduct,
    deleteProduct,
  };
}

export default ProductsController;