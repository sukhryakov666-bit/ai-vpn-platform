import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { JwtPayload } from "@ai-vpn/shared-types";
import { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ConnectivityService } from "./connectivity.service";
import { ProvisionWireGuardDto } from "./dto/provision-wireguard.dto";
import { RevokeStaleWireGuardDto } from "./dto/revoke-stale-wireguard.dto";

type RequestWithUser = Request & { user: JwtPayload };

@ApiTags("connectivity")
@UseGuards(JwtAuthGuard)
@Controller("connectivity")
export class ConnectivityController {
  constructor(private readonly connectivityService: ConnectivityService) {}

  @Post("wireguard/provision")
  async provisionWireGuard(@Req() request: RequestWithUser, @Body() dto: ProvisionWireGuardDto) {
    const requestId = this.getRequestId(request);
    try {
      const result = await this.connectivityService.provisionWireGuardProfile(request.user.sub, dto);
      this.logConnectivityEvent("wireguard_provision_success", {
        request_id: requestId,
        user_id: request.user.sub,
        profile_id: result.profileId,
        node_id: result.node.id,
        region: result.node.region
      });
      return result;
    } catch (error) {
      this.logConnectivityEvent("wireguard_provision_failed", {
        request_id: requestId,
        user_id: request.user.sub,
        region: dto.region ?? null,
        error: error instanceof Error ? error.message : "unknown_error"
      });
      throw error;
    }
  }

  @Post("wireguard/revoke/:profileId")
  async revokeWireGuard(@Req() request: RequestWithUser, @Param("profileId") profileId: string) {
    const requestId = this.getRequestId(request);
    try {
      const result = await this.connectivityService.revokeWireGuardProfile(request.user.sub, profileId);
      this.logConnectivityEvent("wireguard_revoke_success", {
        request_id: requestId,
        user_id: request.user.sub,
        profile_id: result.profileId,
        revoked_at: result.revokedAt
      });
      return result;
    } catch (error) {
      this.logConnectivityEvent("wireguard_revoke_failed", {
        request_id: requestId,
        user_id: request.user.sub,
        profile_id: profileId,
        error: error instanceof Error ? error.message : "unknown_error"
      });
      throw error;
    }
  }

  @Get("wireguard/profiles")
  async listWireGuardProfiles(@Req() request: RequestWithUser) {
    const requestId = this.getRequestId(request);
    const profiles = await this.connectivityService.listWireGuardProfiles(request.user.sub);
    this.logConnectivityEvent("wireguard_profiles_listed", {
      request_id: requestId,
      user_id: request.user.sub,
      profile_count: profiles.length
    });
    return { profiles };
  }

  @Post("wireguard/revoke-stale")
  async revokeStaleWireGuard(@Req() request: RequestWithUser, @Body() body: RevokeStaleWireGuardDto) {
    const requestId = this.getRequestId(request);
    try {
      const result = await this.connectivityService.revokeStaleWireGuardProfiles(request.user.sub, body.maxAgeHours ?? 24);
      this.logConnectivityEvent("wireguard_revoke_stale_success", {
        request_id: requestId,
        user_id: request.user.sub,
        revoked_count: result.revokedCount,
        stale_threshold: result.staleThreshold
      });
      return result;
    } catch (error) {
      this.logConnectivityEvent("wireguard_revoke_stale_failed", {
        request_id: requestId,
        user_id: request.user.sub,
        error: error instanceof Error ? error.message : "unknown_error"
      });
      throw error;
    }
  }

  private getRequestId(request: Request): string | null {
    const requestId = request.headers["x-request-id"];
    if (typeof requestId === "string" && requestId.trim().length > 0) {
      return requestId;
    }
    return null;
  }

  private logConnectivityEvent(event: string, payload: Record<string, unknown>): void {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        component: "api.connectivity",
        event,
        ...payload
      })
    );
  }
}
