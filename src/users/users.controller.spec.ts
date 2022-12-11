import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let fakeUsersService: Partial<UsersService>;
  let fakeAuthService: Partial<AuthService>;

  beforeEach(async () => {
    fakeUsersService = {
      findOne: (id: number) =>
        Promise.resolve({
          id,
          email: 'valid_email@email.com',
          password: 'valid_password',
        } as User),
      find: (email: string) => Promise.resolve([]),
      remove: (id: number) => Promise.resolve({ id } as User),
      update: (id: number, attrs: { email: 'updated_email@mail.com' }) =>
        Promise.resolve({ id, email: 'updated_email@mail.com' } as User),
    };
    fakeAuthService = {
      signup: (email: string, password: string) =>
        Promise.resolve({
          email: 'valid_email@mail.com',
          password: 'valid_password',
        } as User),
      signin: (email: string, password: string) =>
        Promise.resolve({
          id: 1,
          email,
          password,
        } as User),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
        {
          provide: AuthService,
          useValue: fakeAuthService,
        },
      ],
    }).compile();
    controller = module.get<UsersController>(UsersController);
  });

  it('Should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAllUsers returns a list of users with given email', async () => {
    fakeUsersService.find = (email: string) =>
      Promise.resolve([{ email } as User]);
    const users = await controller.findAllUsers('valid_mail@email.com');

    expect(users.length).toEqual(1);
    expect(users[0].email).toEqual('valid_mail@email.com');
  });

  it('findUser returns a single user with the given id', async () => {
    const user = await controller.findUser('any_id');

    expect(user).toBeDefined();
  });

  it('findUser throws an error if user with given id is not found', async () => {
    fakeUsersService.findOne = () => null;
    await expect(controller.findUser('1')).rejects.toThrow(NotFoundException);
  });

  it('signin updates session object and returns user', async () => {
    const session = { userId: 2 };
    const user = await controller.signin(
      { email: 'valid_email', password: 'any_password' },
      session,
    );

    expect(user.id).toEqual(1);
    expect(session.userId).toEqual(1);
  });
});
