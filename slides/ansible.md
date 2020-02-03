class: center, middle

# Ansible

---

# What You Will Learn In This Talk

* Quickly Spin up Linux VMs locally
* Describe your desired server state in yaml
* Automatically deploy that state onto 1..n Linux servers
* Split up, parameterise and re-use state descriptions
* Built-In features: users, files, configuration, etc

---

# Ansible

Tool that let's you define your server **state** in YAML.

State is written down in **playbooks** which include a list of **tasks** or **roles** (grouped tasks).

YAML files are templated with jinja2 (Python templating library).

Environment (e.g. dev/prod/acct) is configured in **inventory** files (yaml/ini).

Ansible connects via SSH to your server and runs all tasks to sync the state. You can also use an Ansible service on your machine to make it faster.

Ansible runs are idempotent: running it multiple times **shouldn't** change the outcome

---

# Spin Up a Local Linux VM

[Vagrant](https://www.vagrantup.com/) is a quick way to spin up and configure a local Linux VM via Virtual Box.

Spin up a local VM:

```sh
brew cask install vagrant virtualbox
mkdir ansible-example && cd ansible-example
vagrant init debian/buster64
vagrant up
vagrant ssh
```
---

# Setup and Test SSH Connection

Create a new ssh host entry in your .ssh/config using the output from:

```sh
vagrant ssh-config --host vagrant
```

and test the connection:

```sh
ssh vagrant
```

---

# Hello World Ansible
```sh
brew install ansible
```

Specify your hosts in an inventory file called **acceptance.yml** with the following contents:

```yaml
all:
  children:
    webservers:
      hosts:
        vagrant
```

Now you can run your ssh commands via:

```sh
ansible webservers -i acceptance.yml -m ping
ansible all --list-hosts -i acceptance.yml
```

---

# Scripts AKA Playbooks

Let's create some users. Create a file called **setup-server.yml**:


```yaml
---
- hosts: webservers
  tasks:
    - name: create default users
      become: yes
      user:
        name: bep
        shell: /bin/bash
    - name: provision ssh keys
      become: yes
      authorized_key:
        user: bep
        key: "{{ lookup('file', '~/.ssh/id_rsa.pub') }}"
```

```sh
ansible-playbook -i acceptance.yml setup-server.yml
ssh bep@vagrant -i ~/.ssh/id_rsa
```

---

# Per Host Variables (1/2)

What if we have different users on acceptance and production? Edit **acceptance.yml**:


```yaml
all:
  children:
    webservers:
      hosts:
        vagrant:
          shell_users:
            - {login: "bep", ssh_key: "id_rsa.pub"}
```

---

# Per Host Variables (2/2)

Let's re-use the variables in **setup-server.yml**:


```yaml
---
- hosts: webservers
  tasks:
    - name: create default users
      become: yes
      user:
        name: "{{ item.login }}"
        shell: /bin/bash
      loop: "{{ shell_users }}"        
    - name: provision ssh keys
      become: yes
      authorized_key:
        user: "{{ item.login }}"
        key: "{{ lookup('file', '~/.ssh/' + item.ssh_key) }}"
      loop: "{{ shell_users }}"
```

---

# Modules

* Re-usable [scripts](https://docs.ansible.com/ansible/latest/modules/list_of_all_modules.html):
  * [lineinfile](https://docs.ansible.com/ansible/latest/modules/lineinfile_module.html#lineinfile-module)
  * [template](https://docs.ansible.com/ansible/latest/modules/template_module.html#template-module)
  * [replace](https://docs.ansible.com/ansible/latest/modules/replace_module.html#replace-module)
  * [shell](https://docs.ansible.com/ansible/latest/modules/shell_module.html#shell-module)
  * [copy](https://docs.ansible.com/ansible/latest/modules/copy_module.html#copy-module)
  * [systemd](https://docs.ansible.com/ansible/latest/modules/systemd_module.html#systemd-module)
  * [docker](https://docs.ansible.com/ansible/latest/modules/list_of_cloud_modules.html#docker)
  * [get_url](https://docs.ansible.com/ansible/latest/modules/get_url_module.html)
  * etc
---

# Ansible Galaxy

[Community modules](https://galaxy.ansible.com/) which you can [install locally](https://docs.ansible.com/ansible/latest/galaxy/user_guide.html#the-command-line-tool) for a playbook or globally for all playbooks

---

# Roles

Grouping playbook tasks and files. Edit **server-setup.yml**:

```yaml
---
- hosts: webservers
  roles:
    - users
```

Could also include roles like:
* **commerce**
* **hippo_dxp_bloomreach_xp**
* **locationservice**

---

# Roles Structure

Let's create the following folder hierarchy:

```sh
mkdir -p roles/users/tasks
```

Directory a role directory includes:

* **tasks**
* **handlers**: events listeners: if web server restart is sent, execute systemctl restart httpd.service
* **defaults**
* **vars**
* **files**
* **templates**
* **meta**

---

# User Role

Now fill the **roles/users/tasks/main.yml** file with the following contents:

```yaml
- name: create default users
  become: yes
  user:
    name: "{{ item.login }}"
    shell: /bin/bash
  loop: "{{ shell_users }}"        
- name: provision ssh keys
  become: yes
  authorized_key:
    user: "{{ item.login }}"
    key: "{{ lookup('file', '~/.ssh/' + item.ssh_key) }}"
  loop: "{{ shell_users }}"
```

---

# Sensitive Data (Passwords, Tokens)

[Ansible Vault](https://docs.ansible.com/ansible/latest/user_guide/vault.html) let's you check in password encrypted files and strings into Git.

Create a file called **password.txt** in your home directory that only has the password in it. Example password here is **potato**.

**Do not commit that file into Git repos!**

Copy this file onto the machine that runs your Ansible playbooks!

---

# Creating Encrypted Variables

```sh
ansible-vault encrypt_string --vault-password-file ~/password.txt 'mypassword' \
  --name 'dbpassword'
```

spits out this which you can re-use in your inventory files:

```yaml
dbpassword: !vault |
          $ANSIBLE_VAULT;1.1;AES256
          38646361363764333435643838356437663538643764356139336364353630636537393539343061
          3635313161643564633534626236376464393262343334360a383865326663343333313836336436
          63626264663938633564363835633563633435633736333064363962306562386538333465363032
          6461653831613536640a363037643439666530623062313438376666306238663639323233393435
          3739
```

---


# Creating Encrypted Variables Example

Edit the appropriate inventory file to include it like this:

```yaml
all:
  children:
    servers:
      hosts:
        vagrant:
          shell_users:
            - {login: "bep", ssh_key: "id_rsa.pub"}
          dbpassword: !vault |
            $ANSIBLE_VAULT;1.1;AES256
            38646361363764333435643838356437663538643764356139336364353630636537393539343061
            3635313161643564633534626236376464393262343334360a383865326663343333313836336436
            63626264663938633564363835633563633435633736333064363962306562386538333465363032
            6461653831613536640a363037643439666530623062313438376666306238663639323233393435
            3739
```

---


# Reading Encrypted Variables

Use the following command to decrypt specific variables

```sh
ansible servers -i acceptance.yml -m debug -a 'var=dbpassword' \
  --vault-password-file ~/password.txt
```

---

# Creating Encrypted Files

Use the following command to create an encrypted file. Ansible will use your default editor to edit the file.

```sh
ansible-vault create --vault-password-file ~/password.txt secret.yml
```

You can decrypt the file but you should prefer using editing since it takes care of re-encrypting the file automatically:

```sh
ansible-vault edit --vault-password-file ~/password.txt secret.yml
```


---

# Your Job

* Set up a web server (apache/NGinx/node/etc) that serves a web page
* Test page locally via **vagrant ssh** or set up [port forwarding through Vagrant](https://www.vagrantup.com/docs/networking/forwarded_ports.html#defining-a-forwarded-port)
