import { Injectable } from '@nestjs/common';
import { SupervisorDivisionHelperService } from './helpers/supervisor-division-helper.service';
import { CreateDivisionDto } from '../dto/create-division.dto';

@Injectable()
export class SupervisorDivisionsService {
  constructor(
    private readonly divisionHelper: SupervisorDivisionHelperService,
  ) {}

  async getAllDivision() {
    const divisions = await this.divisionHelper.getAllDivisions();
    return divisions;
  }

  async createNewDivision(payload:CreateDivisionDto){
    return await this.divisionHelper.createNewDivision(payload)
  }

  async editDivision(paylaod:CreateDivisionDto, oldId:string){
    return await this.divisionHelper.editDivisionById(paylaod, oldId)
  }

  async deleteDivision(id:string){
    return await this.divisionHelper.softDeleteDivisionById(id)
  }
}
