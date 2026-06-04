export interface ISkill {
    name: string;
    description: string;
    execute(params: any): Promise<string>;
}
