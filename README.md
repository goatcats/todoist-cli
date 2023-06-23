# Todoist-CLI
Simple CLI using Todoist-API for linux


## Install
#### Clone the repository and change to the project directory
```
$ git clone https://github.com/goatcats/todoist-cli.git
$ cd todoist-cli
```
#### Build the executable
```
$ sudo npm run build
```

## Usage

~~~
$ todo <option>
~~~

**Options:**
- `l - list tasks`
- `e - edit tasks`
- `a - add task`
- `conf - edit api-token & project`

At first usage `todo conf` will be run first regardless of the option that was given.

### l - list tasks
~~~
┌───┬─────────────────┬───┬───────┬─────────────┐
│ 3 │ Date            │ P │ Task  │ Description │
├───┼─────────────────┼───┼───────┼─────────────┤
│ 0 │ Tue Jun 20 2023 │ 2 │ Bread │ --          │
│ 1 │ Thu Jun 22 2023 │ 4 │ Eggs  │ --          │
│ 2 │ Sun Jun 25 2023 │ 1 │ Milk  │ --          │
└───┴─────────────────┴───┴───────┴─────────────┘
~~~

### e - edit tasks
~~~
┌───┬─────────────────┬───┬───────┬─────────────┐
│ 3 │ Date            │ P │ Task  │ Description │
├───┼─────────────────┼───┼───────┼─────────────┤
│ 0 │ Tue Jun 20 2023 │ 2 │ Bread │ --          │
│ 1 │ Thu Jun 22 2023 │ 4 │ Eggs  │ --          │
│ 2 │ Sun Jun 25 2023 │ 1 │ Milk  │ --          │
└───┴─────────────────┴───┴───────┴─────────────┘
Syntax: <number> <option> [value] | help
>> 2 date 2023-06-23
~~~
Options:
- name 
- description
- date (YYYY-MM-DD)
- priority (1-4)
- done (complete a task)

### a - add task
~~~
┌───┬─────────────────┬───┬───────┬─────────────┐
│ 3 │ Date            │ P │ Task  │ Description │
├───┼─────────────────┼───┼───────┼─────────────┤
│ 0 │ Tue Jun 20 2023 │ 2 │ Bread │ --          │
│ 1 │ Thu Jun 22 2023 │ 4 │ Eggs  │ --          │
│ 2 │ Sun Jun 25 2023 │ 1 │ Milk  │ --          │
└───┴─────────────────┴───┴───────┴─────────────┘
Name: Butter
Description: 
Date (YYYY-MM-DD): 2023-06-23
Priority: 3
~~~

### conf - edit api-token & project
~~~
--- Setup Wizard ---

Todoist API-Token: qwertzuiop1234567890asdfghjkl

Select a project (default: Inbox)
[0] Inbox
[1] Shopping List
>> 1
~~~

## Dependencies

- npm 9.2.0
