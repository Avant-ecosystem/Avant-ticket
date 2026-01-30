import { Test, TestingModule } from '@nestjs/testing';
import { AmplifyController } from './amplify.controller';
import { AmplifyService } from './amplify.service';

describe('AmplifyController', () => {
  let controller: AmplifyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AmplifyController],
      providers: [AmplifyService],
    }).compile();

    controller = module.get<AmplifyController>(AmplifyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
