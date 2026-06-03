import { TeamsTemplate } from "@/features/teams/teams.template";
import { Metadata } from "next";

export const metadata:Metadata = {
    title:"Manajemen Tim"
}

export default function TeamPage(){
    return <TeamsTemplate />
}