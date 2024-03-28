import { Prisma } from "@prisma/client";

import { db } from "~/integrations/prisma.server";
import { withServiceErrorHandling } from "~/services/helpers";
import { OmitFromWhere, Operation } from "~/services/types";

type Model = typeof db.transaction;
type MethodModel = typeof db.transactionItemMethod;
type TypeModel = typeof db.transactionItemType;
type TransactionResult<T, O extends Operation> = Promise<Prisma.Result<Model, T, O>>;
type MethodResult<T, O extends Operation> = Promise<Prisma.Result<MethodModel, T, O>>;
type TypeResult<T, O extends Operation> = Promise<Prisma.Result<typeof db.transactionItemType, T, O>>;

interface ITransactionService {
  getTransactionById<T extends Prisma.Args<Model, "findUnique">>(
    id: string,
    args?: T,
  ): TransactionResult<T, "findUnique">;

  getTransactions<T extends Prisma.Args<Model, "findMany">>(args?: T): TransactionResult<T, "findMany">;
  getItemMethods<T extends Prisma.Args<MethodModel, "findMany">>(args?: T): MethodResult<T, "findMany">;
  getItemTypes<T extends Prisma.Args<TypeModel, "findMany">>(args?: T): TypeResult<T, "findMany">;
}

class Service implements ITransactionService {
  public async getTransactionById<T extends OmitFromWhere<Prisma.Args<Model, "findUnique">, "id">>(
    id: string,
    args?: T,
  ) {
    return withServiceErrorHandling<Model, T, "findUnique">(async () => {
      const transaction = await db.transaction.findUnique({
        ...args,
        where: { id, ...args?.where },
      });
      return transaction;
    });
  }

  public async getItemMethods<T extends Prisma.Args<MethodModel, "findMany">>(args?: T) {
    return withServiceErrorHandling<MethodModel, T, "findMany">(async () => {
      const methods = await db.transactionItemMethod.findMany(args);
      return methods;
    });
  }

  public async getItemTypes<T extends Prisma.Args<TypeModel, "findMany">>(args?: T) {
    return withServiceErrorHandling<TypeModel, T, "findMany">(async () => {
      const types = await db.transactionItemType.findMany(args);
      return types;
    });
  }

  public async getTransactions<T extends Prisma.Args<Model, "findMany">>(args?: T) {
    return withServiceErrorHandling<Model, T, "findMany">(async () => {
      const transactions = await db.transaction.findMany(args);
      return transactions;
    });
  }
}

export const TransactionService = new Service();
