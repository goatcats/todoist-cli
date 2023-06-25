import { TodoistApi } from '@doist/todoist-api-typescript';
import * as fs from 'node:fs';
import promptSync from "prompt-sync";
const input = promptSync();
import CG from 'console-grid';
import chalk from 'chalk';

let projects, project

const path = process.argv[1].replace("main.mjs", "");

(async function main() {
    function getData() {
        const data = JSON.parse(fs.readFileSync(`${path}data.json`, {encoding:"utf8", flag:"r"}));
        return !!data.projects && !!data.selected && !!data.api_key ? data : null;
    }
    let data = getData();

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
    data = getData();
    const api = new TodoistApi(data.api_key);

    function incTime(timeString, hours) {
        const [hoursStr, minutesStr] = timeString.split(":");
        let totalMinutes = parseInt(hoursStr) * 60 + parseInt(minutesStr);
        totalMinutes += hours * 60;
        const newHours = Math.floor(totalMinutes / 60) % 24;
        const newMinutes = totalMinutes % 60;
        const paddedHours = String(newHours).padStart(2, "0");
        const paddedMinutes = String(newMinutes).padStart(2, "0");
        return `${paddedHours}:${paddedMinutes}`;
    }

    async function list_tasks(callback) {
        if (process.stdout.columns < 95) {
            console.log("Terminal is too narrow.\nRequired width: 95");
            return;
        }
        console.log('\x1Bc');
        const tasks = await api.getTasks({projectId:data.selected.id});
        const rows = [];
        const isToday = (obj) => new Date().toDateString() === new Date(obj.due.date).toDateString();
        const isOverdue = (obj) => new Date() > new Date(obj.due.date)
        const correct = (str) => str.replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss");

        tasks.sort((a, b) => {
            if (!a.due) return -1;
            if (!b.due) return 1;
            return new Date(a.due.date) - new Date(b.due.date);
        });

        for (let i=0; i<tasks.length; i++) {
            if (!tasks[i].due) {
                rows.push([chalk.gray(i), chalk.gray("--"), chalk.gray(tasks[i].priority), chalk.gray(correct(tasks[i].content.length>29 ? tasks[i].content.slice(0, 27)+"..." : tasks[i].content)), chalk.gray(tasks[i].description === "" || tasks[i].description === null ? "--" : correct(tasks[i].description.length>29 ? tasks[i].description.slice(0, 27)+"..." : tasks[i].description))]);
            } else if (isToday(tasks[i])) {
                rows.push([chalk.green(i), chalk.green(new Date(tasks[i].due.date).toDateString()), chalk.green(!!tasks[i].due.datetime?incTime(tasks[i].due.datetime.slice(11,16),2):"--"), chalk.green(tasks[i].priority), chalk.green(correct(tasks[i].content.length>29 ? tasks[i].content.slice(0, 27)+"..." : tasks[i].content)), chalk.green(tasks[i].description === "" || tasks[i].description === null ? "--" : correct(tasks[i].description.length>29 ? tasks[i].description.slice(0, 27)+"..." : tasks[i].description))]);
            } else if (isOverdue(tasks[i])) {
                rows.push([chalk.red(i), chalk.red(new Date(tasks[i].due.date).toDateString()), chalk.red(!!tasks[i].due.datetime?incTime(tasks[i].due.datetime.slice(11,16),2):"--"), chalk.red(tasks[i].priority), chalk.red(correct(tasks[i].content.length>29 ? tasks[i].content.slice(0, 27)+"..." : tasks[i].content)), chalk.red(tasks[i].description === "" || tasks[i].description === null ? "--" : correct(tasks[i].description.length>29 ? tasks[i].description.slice(0, 27)+"..." : tasks[i].description))]);
            } else {
                rows.push([chalk.blue(i), chalk.blue(new Date(tasks[i].due.date).toDateString()), chalk.blue(!!tasks[i].due.datetime?incTime(tasks[i].due.datetime.slice(11,16),2):"--"), chalk.blue(tasks[i].priority), chalk.blue(correct(tasks[i].content.length>29 ? tasks[i].content.slice(0, 27)+"..." : tasks[i].content)), chalk.blue(tasks[i].description === "" || tasks[i].description === null ? "--" : correct(tasks[i].description.length>29 ? tasks[i].description.slice(0, 27)+"..." : tasks[i].description))]);
            }
        }

        CG({
            "columns": [chalk.bold(tasks.length), chalk.bold("Date"), chalk.bold("Time"), chalk.bold("P"), chalk.bold("Task"), chalk.bold("Description")],
            "rows": rows
        });

        await callback(tasks, data, incTime);
    }

    switch (args[0]) {
        case "l":
            await list_tasks(()=>{});
            break;

        case "e":
            let help = false;
            await list_tasks(async (tasks, confData, incTime) => {
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
                        if ("name description date time priority done".includes(inpArgs[1])) {
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
                    } else if (toChange === "time") {
                        if (data.val[0]==="" || data.val===[]) {
                            console.log((await api.getTask(data.task_id)).due.date);
                            await api.updateTask(data.task_id, {
                                dueDate: (await api.getTask(data.task_id)).due.date
                            }); return;
                        } else {
                            await api.updateTask(data.task_id, {
                                dueDatetime:`${(await api.getTask(data.task_id)).due.date}T${incTime(data.val[0],-2)}:00Z`
                            }); return;
                        }
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
            
            await list_tasks(async (tasks, confData, incTime)=>{
                const vName = (name) => name && name.length < 30 && name.length > 2;
                const vDescription = (description) => description.length < 45;
                const vDate = (date) => (date && /^\d{4}-\d{2}-\d{2}$/.test(date));
                const vTime = (time) => (time && /^([01]\d|2[0-3]):([0-5]\d)$/.test(time) || time==="");
                const vPriority = (priority) => (priority && priority >= 1 && priority <= 4);
                
                const data = (() => {
                    let name, description, date, time, priority;
                    while (true) {
                        name = input("Name: ");
                        if (!name) {process.exit(1)}
                        description = input("Description: ");
                        if (!description) {description = ""}
                        date = input("Date (YYYY-MM-DD): ");
                        if (!date) {process.exit(1)}
                        time = input("Time: ");
                        if (!time) {time=""}
                        priority = input("Priority: ");
                        if (!priority) {priority = 1}
                        if (vName(name) && vDescription(description) && vDate(date) && vTime(time)  && vPriority(priority)) {break}
                        else {console.log(chalk.red("Invalid values\n"))}
                    }
                    return {name, description, date, time, priority};
                })()

                if (data.time === "") {
                    await api.addTask({
                        content: data.name,
                        description: data.description,
                        dueDate:data.date,
                        priority: data.priority,
                        projectId: confData.selected.id
                    });
                } else {
                    await api.addTask({
                        content: data.name,
                        description: data.description,
                        dueDatetime:`${data.date}T${incTime(data.time,-2)}:00Z`,
                        priority: data.priority,
                        projectId: confData.selected.id
                    });
                }
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
