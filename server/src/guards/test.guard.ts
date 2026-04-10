import { CanActivate, Injectable } from "@nestjs/common";

@Injectable()
export class TestGuard implements CanActivate{
    canActivate(): boolean {
        const environment = process.env.NODE_ENV

        return environment === "development"
    }
}