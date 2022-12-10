import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;
  const users: User[] = [];

  beforeEach(async () => {
    //Create a fake copy of the users service
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 999999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };
    //Create a testing module to run the service
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          //whenever UsersService is required, re-route to fakeUsersService
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('Should create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('Should create a new user with a salted and hashed password', async () => {
    const user = await service.signup('test@test.com', 'valid_password');

    expect(user.password).not.toEqual('valid_password');

    const [salt, hash] = user.password.split('.');

    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('Should throw an error if user signs up with email that is already in use', async () => {
    await service.signup('any_mail@mail.com', 'any_password');

    await expect(
      service.signup('any_mail@mail.com', 'any_password'),
    ).rejects.toThrow(BadRequestException);
  });

  it('Should throw if signin is called with an unused email', async () => {
    await expect(
      service.signin('unused_email@mail.com', 'any_password'),
    ).rejects.toThrow(NotFoundException);
  });

  it('Should throw if an invalid password is provided', async () => {
    await service.signup('another_valid_email@mail.com', 'valid_password');

    await expect(
      service.signin('another_valid_email@mail.com', 'invalid_password'),
    ).rejects.toThrow(BadRequestException);
  });

  it('Should return a user if valid password is provided', async () => {
    await service.signup('valid_email@mail.com', 'valid_password');

    const user = await service.signin('valid_email@mail.com', 'valid_password');

    expect(user).toBeDefined();
  });
});
