import { Module } from "@medusajs/framework/utils"
import FundraisingModuleService from "./service"

export const FUNDRAISING_MODULE = "fundraisingModuleService"

export default Module(FUNDRAISING_MODULE, {
  service: FundraisingModuleService,
})