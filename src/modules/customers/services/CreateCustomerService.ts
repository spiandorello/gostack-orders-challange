import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Customer from '../infra/typeorm/entities/Customer';
import ICustomersRepository from '../repositories/ICustomersRepository';

interface IRequest {
  name: string;
  email: string;
}

@injectable()
class CreateCustomerService {
  constructor(
    @inject('customersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ name, email }: IRequest): Promise<Customer> {
    const user = this.customersRepository.findByEmail(email);
    if (user) {
      throw new AppError('This email already used');
    }

    return this.customersRepository.create({
      name,
      email,
    });
  }
}

export default CreateCustomerService;
