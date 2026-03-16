import { TeamsTemplate } from "@/features/teams/teams.template";
import { Metadata } from "next";

export const metadata:Metadata = {
    title:"Team Management"
}

export default function TeamPage(){
    return <TeamsTemplate />
}