import { Prisma, TransactionItemTypeDirection } from "@prisma/client";
import { z } from "zod";

import { prisma } from "~/integrations/prisma.server";
import { TransactionItemSchema } from "~/models/schemas";
import { withServiceErrorHandling } from "~/services/helpers";
import { OmitFromData, OmitFromWhere, Operation } from "~/services/types";

type Model = typeof prisma.transaction;
type MethodModel = typeof prisma.transactionItemMethod;
type TypeModel = typeof prisma.transactionItemType;
type TransactionResult<T, O extends Operation> = Promise<Prisma.Result<Model, T, O>>;
type MethodResult<T, O extends Operation> = Promise<Prisma.Result<MethodModel, T, O>>;
type TypeResult<T, O extends Operation> = Promise<Prisma.Result<typeof prisma.transactionItemType, T, O>>;

interface ITransactionService {
  getTransactionById<T extends Prisma.Args<Model, "findUnique">>(
    id: string,
    args?: T,
  ): TransactionResult<T, "findUnique">;

  getTransactions<T extends Prisma.Args<Model, "findMany">>(args?: T): TransactionResult<T, "findMany">;
  getItemMethods<T extends Prisma.Args<MethodModel, "findMany">>(args?: T): MethodResult<T, "findMany">;
  getItemTypes<T extends Prisma.Args<TypeModel, "findMany">>(args?: T): TypeResult<T, "findMany">;

  createTransaction<T extends Prisma.Args<Model, "create">>(args: T): TransactionResult<T, "create">;
  // updateTransaction<T extends Prisma.Args<Model, "update">>(id: string, args: T): TransactionResult<T, "update">;
  // deleteTransaction<T extends Prisma.Args<Model, "delete">>(id: string, args: T): TransactionResult<T, "delete">;
}

class Service implements ITransactionService {
  public async getTransactionById<T extends OmitFromWhere<Prisma.Args<Model, "findUnique">, "id">>(
    id: string,
    args?: T,
  ) {
    return withServiceErrorHandling<Model, T, "findUnique">(async () => {
      const transaction = await prisma.transaction.findUnique({
        ...args,
        where: { id, ...args?.where },
      });
      return transaction as Prisma.Result<Model, T, "findUnique">;
    });
  }

  public async getItemMethods<T extends Prisma.Args<MethodModel, "findMany">>(args?: T) {
    return withServiceErrorHandling<MethodModel, T, "findMany">(async () => {
      const methods = await prisma.transactionItemMethod.findMany(args);
      return methods as Prisma.Result<MethodModel, T, "findMany">;
    });
  }

  public async getItemTypes<T extends Prisma.Args<TypeModel, "findMany">>(args?: T) {
    return withServiceErrorHandling<TypeModel, T, "findMany">(async () => {
      const types = await prisma.transactionItemType.findMany(args);
      return types as Prisma.Result<TypeModel, T, "findMany">;
    });
  }

  public async getTransactions<T extends Prisma.Args<Model, "findMany">>(args?: T) {
    return withServiceErrorHandling<Model, T, "findMany">(async () => {
      const transactions = await prisma.transaction.findMany(args);
      return transactions as Prisma.Result<Model, T, "findMany">;
    });
  }

  public async createTransaction<
    T extends OmitFromData<Prisma.Args<Model, "create">, "amountInCents" | "transactionItems">,
  >(
    args: T & {
      transactionItems: Array<z.infer<typeof TransactionItemSchema>>;
    },
  ) {
    return withServiceErrorHandling<Model, T, "create">(async () => {
      const { transactionItems, data, ...rest } = args;
      const { accountId, contactId, orgId, ...restOfData } = data;

      const trxItemTypes = await this.getItemTypes();
      const total = transactionItems.reduce((acc, i) => {
        const type = trxItemTypes.find((t) => t.id === i.typeId);
        if (!type) {
          return acc;
        }
        const modifier = type.direction === TransactionItemTypeDirection.IN ? 1 : -1;
        return acc + i.amountInCents * modifier;
      }, 0);

      const transaction = await prisma.transaction.create({
        ...rest,
        data: {
          ...restOfData,
          orgId,
          amountInCents: total,
          transactionItems: {
            createMany: {
              data: transactionItems.map((i) => {
                const type = trxItemTypes.find((t) => t.id === i.typeId);
                if (!type) {
                  return i;
                }
                const modifier = type.direction === TransactionItemTypeDirection.IN ? 1 : -1;
                return {
                  ...i,
                  orgId,
                  amountInCents: i.amountInCents * modifier,
                };
              }),
            },
          },
          account: { connect: { id: accountId } },
          contact: contactId ? { connect: { id: contactId } } : undefined,
        },
      });
      return transaction as Prisma.Result<Model, T, "create">;
    });
  }
}

export const TransactionService = new Service();
