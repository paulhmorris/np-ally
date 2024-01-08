import { Prisma } from "@prisma/client";

import { prisma } from "~/integrations/prisma.server";

type Model = typeof prisma.contact;
type TypeModel = typeof prisma.contactType;

interface IContactService {
  getContacts<T extends Prisma.Args<Model, "findMany">>(args?: T): Promise<Prisma.Result<Model, T, "findMany">>;
  getContactTypes<T extends Prisma.Args<TypeModel, "findMany">>(
    args?: T,
  ): Promise<Prisma.Result<TypeModel, T, "findMany">>;
}

class Service implements IContactService {
  public async getContacts<T extends Prisma.Args<Model, "findMany">>(args?: T) {
    const contacts = await prisma.contact.findMany(args);
    return contacts as Prisma.Result<Model, T, "findMany">;
  }

  public async getContactTypes<T extends Prisma.Args<TypeModel, "findMany">>(args?: T) {
    const types = await prisma.contactType.findMany(args);
    return types as Prisma.Result<TypeModel, T, "findMany">;
  }
}

export const ContactService = new Service();
