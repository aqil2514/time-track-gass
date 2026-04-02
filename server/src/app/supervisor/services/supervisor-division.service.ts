import { Injectable } from "@nestjs/common";
import { SupervisorDivisionHelperService } from "./helpers/supervisor-division-helper.service";

@Injectable()
export class SupervisorDivisionsService{
    constructor(
        private readonly divisionHelper:SupervisorDivisionHelperService
    ){}
    async getAllDivision(){
        const divisions = await this.divisionHelper.getAllDivisions()
        return divisions
    }
}