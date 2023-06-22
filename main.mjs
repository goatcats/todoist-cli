import { TodoistApi } from '@doist/todoist-api-typescript';
import * as fs from 'node:fs';
import promptSync from "prompt-sync";
const input = promptSync();
import CG from 'console-grid';
import chalk from 'chalk';

let projects, project // 5d0fcc3adbe9ed4a397f8d88a26089c3102f608d

const path = process.argv[1].replace("main.mjs", "");

(async function main() {
    const data = (() => {
        const data = JSON.parse(fs.readFileSync(`${path}data.json`, {encoding:"utf8", flag:"r"}));
        return !!data.projects && !!data.selected && !!data.api_key ? data : null;
    })();

    async function setUpWizard() {
        console.log('\x1Bc');
        console.log("--- Setup Wizard ---\n");
        while (true) {
            const api_key = input("Todoist API-Token: ");
            if (!api_key) {process.exit(1)}
            projects = await (async () => {
                try {projects = await (new TodoistApi(api_key)).getProjects()}
                catch (error) {return null}
                return projects;
            })();     
            if (!!projects) {
                console.log("\nSelect a project (default: Inbox)");
                for (let i=0; i<projects.length; i++) {
                    console.log(`[${i}] ${projects[i].name}`);
                }
                const inp = input(">> ");
                if (!inp) {process.exit(1)}
                if ((() => 0 <= inp < projects.length ? inp : null)()) {
                    project = projects[inp];
                } else {
                    project = projects[0];
                }
                fs.writeFileSync(`${path}data.json`, JSON.stringify({
                    "projects": projects,
                    "selected": project,
                    "api_key": api_key
                }), {encoding:"utf8", flag:"w"});
                break;
            } else {
                console.log("Invalid");
            }
        }
    }

    if (!data) {
        await setUpWizard();
    }

    const args = process.argv.slice(2);
    const api = new TodoistApi(data.api_key);

    async function list_tasks(callback) {
        console.log('\x1Bc');
        const tasks = await api.getTasks({projectId:data.selected.id});
        const rows = [];
        const isToday = (obj) => new Date().toDateString() === new Date(obj.due.date).toDateString();
        const isOverdue = (obj) => new Date() > new Date(obj.due.date)

        tasks.sort((a, b) => {
            if (!a.due) return -1;
            if (!b.due) return 1;
            return new Date(a.due.date) - new Date(b.due.date);
        });

        for (let i=0; i<tasks.length; i++) {
            if (!tasks[i].due) {
                rows.push([chalk.gray(i), chalk.gray("--"), chalk.gray(tasks[i].priority), chalk.gray(tasks[i].content), chalk.gray(tasks[i].description === "" ? "--" : tasks[i].description)]);
            } else if (isToday(tasks[i])) {
                rows.push([chalk.green(i), chalk.green(new Date(tasks[i].due.date).toDateString()), chalk.green(tasks[i].priority), chalk.green(tasks[i].content), chalk.green(tasks[i].description === "" ? "--" : tasks[i].description)]);
            } else if (isOverdue(tasks[i])) {
                rows.push([chalk.red(i), chalk.red(new Date(tasks[i].due.date).toDateString()), chalk.red(tasks[i].priority), chalk.red(tasks[i].content), chalk.red(tasks[i].description === "" ? "--" : tasks[i].description)]);
            } else {
                rows.push([chalk.blue(i), chalk.blue(new Date(tasks[i].due.date).toDateString()), chalk.blue(tasks[i].priority), chalk.blue(tasks[i].content), chalk.blue(tasks[i].description === "" ? "--" : tasks[i].description)]);
            }
        }

        CG({
            "columns": [chalk.bold(tasks.length), chalk.bold("Date"), chalk.bold("P"), {"name":chalk.bold("Task"), "maxWidth":30}, {"name":chalk.bold("Description"), "maxWidth":30}],
            "rows": rows
        });

        await callback(tasks, data);
    }

    switch (args[0]) {
        case "l":
            await list_tasks(()=>{});
            break;

        case "e":
            let help = false;
            await list_tasks(async (tasks, confData) => {
                console.log(`Syntax: <number> <option> [value] | help`);
                const inpString = input(">> ");
                if (!inpString) {process.exit(1)}
                const data = (() => {
                    const inpArgs = inpString.split(" ");
                    if (inpArgs.length === 1 && inpArgs[0] === "help") {
                        console.log(`Options:
- name 
- description
- date (YYYY-MM-DD)
- priority (1-4)
- done (complete a task)`);
                        return "help";
                    } else if (0 <= inpArgs[0] && inpArgs[0] < tasks.length) {
                        if ("name description date priority done".includes(inpArgs[1])) {
                            switch (inpArgs[1]) {
                                case "name": inpArgs[1] = "content"; break;
                                case "date": inpArgs[1] = "dueDate"; break;
                            }
                            return {"task_id": tasks[inpArgs[0]].id, "option": inpArgs[1], "val": inpArgs.slice(2)};
                        } else {console.log("Invalid Option");return null}
                    } else {console.log("Invalid Number");return null}
                })();
                if (data && data !== "help") {
                    const toChange = data.option;
                    if (toChange === "done") {
                        await api.closeTask(data.task_id); return;
                    }
                    const updateObj = {};
                    let value = data.val.join(" ");
                    if (toChange === "priority") {value = data.val[0]}
                    updateObj[toChange] = (value === "") ? true : value;
                    try {
                        await api.updateTask(data.task_id, updateObj);
                    } catch (error) {
                        console.log("Error uploading selection");
                    } 
                } else if (data === "help") {
                    help = true
                }
            });
            if (!help) {
                await list_tasks(()=>{});
            }
            break;

        case "a":
            
            await list_tasks(async (tasks, confData)=>{
                const vName = (name) => name && name.length < 30 && name.length > 2;
                const vDescription = (description) => description.length < 45;
                const vDate = (date) => date && /^\d{4}-\d{2}-\d{2}$/.test(date);
                const vPriority = (priority) => priority && priority >= 1 && priority <= 4;
                
                const data = (() => {
                    let name, description, date, priority;
                    while (true) {
                        name = input("Name: ");
                        if (!name) {process.exit(1)}
                        description = input("Description: ");
                        if (!description) {description = ""}
                        date = input("Date (YYYY-MM-DD): ");
                        if (!date) {process.exit(1)}
                        priority = input("Priority: ");
                        if (!priority) {process.exit(1)}
                        if (vName(name) && vDescription(description) && vDate(date) && vPriority(priority)) {break}
                        else {console.log(chalk.red("Invalid values\n"))}
                    }
                    return {name, description, date, priority};
                })();
                await api.addTask({
                    content: data.name,
                    description: data.description,
                    dueDate: data.date,
                    priority: data.priority,
                    projectId: confData.selected.id
                });
            });
            await list_tasks(()=>{});
            break;

        case "conf":
            await setUpWizard();
            break;

        default:
            console.log("Usage: todo <option>\nOptions:\nl - list tasks\ne - edit tasks\na - add task");
            break;
    }
    
})();
