import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('ordersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('productsRepository')
    private productsRepository: IProductsRepository,

    @inject('customersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);
    if (!customer) {
      throw new AppError('Customer not found.');
    }

    const productIds = products.map(product => ({
      id: product.id,
    }));

    const productsData = await this.productsRepository.findAllById(productIds);
    if (!productsData.length) {
      throw new AppError('Empty products.');
    }

    const existentProductsIds = productsData.map(product => product.id);
    const checkInexistentProducts = products.filter(
      product => !existentProductsIds.includes(product.id),
    );

    if (checkInexistentProducts.length) {
      throw new AppError(
        `Inexistent product id ${checkInexistentProducts[0].id}`,
      );
    }

    const findUnavailableQuantityProducts = products.filter(
      product =>
        productsData.filter(p => p.id === product.id)[0].quantity <
        product.quantity,
    );

    if (findUnavailableQuantityProducts.length) {
      throw new AppError(
        `Unavailable quantity product id ${findUnavailableQuantityProducts[0].id}`,
      );
    }

    const serializedProduct = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: productsData.filter(p => p.id === product.id)[0].price,
    }));

    const order = await this.ordersRepository.create({
      customer,
      products: serializedProduct,
    });

    const { order_products } = order;

    const orderProductsQuantity = order_products.map(product => ({
      id: product.product_id,
      quantity:
        productsData.filter(p => p.id === product.product_id)[0].quantity -
        product.quantity,
    }));

    await this.productsRepository.updateQuantity(orderProductsQuantity);

    return order;
  }
}

export default CreateOrderService;
