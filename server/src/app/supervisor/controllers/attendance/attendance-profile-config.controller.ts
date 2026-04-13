import { Controller, Get, UseGuards } from "@nestjs/common";
import { Roles } from "src/decorators/roles.decorator";
import { JwtAuthSupervisorGuard } from "src/guards/jwt-supervisor.guard";
import { RoleGuard } from "src/guards/role.guard";
import { AttendanceProfileConfigService } from "../../services/attendance/attendance-profile-config.service";

@UseGuards(JwtAuthSupervisorGuard, RoleGuard)
@Roles('supervisor')
@Controller('supervisor/attendance/profile-config')
export class AttendanceProfileConfigController{
    constructor(
        private readonly service:AttendanceProfileConfigService
    ){}
    @Get()
    async getProfileWorkConfig(){
        return await this.service.getAllProfileConfig()
    }
}