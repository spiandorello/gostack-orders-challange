import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Product from '../infra/typeorm/entities/Product';
import IProductsRepository from '../repositories/IProductsRepository';

interface IRequest {
  name: string;
  price: number;
  quantity: number;
}

@injectable()
class CreateProductService {
  constructor(
    @inject('productsRepository')
    private productsRepository: IProductsRepository,
  ) {}

  public async execute({ name, price, quantity }: IRequest): Promise<Product> {
    const product = await this.productsRepository.findByName(name);
    if (product) {
      throw new AppError('This product already exists');
    }

    return this.productsRepository.create({
      name,
      price,
      quantity,
    });
  }
}

export default CreateProductService;
