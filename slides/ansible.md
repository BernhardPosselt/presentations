class: center, middle

# Ansible

---

# What You Will Learn In This Talk

* Quickly Spin up Linux VMs locally
* Describe your desired server state in yaml
* Automatically deploy that state onto 1..n Linux servers
* Split up, parameterise and re-use state descriptions
* Built-In features: users, applications, files, configuration, etc

---

# Set Up Linux VM

Vagrant is a quick way to spin up and configure a local Linux VM via Virtual Box.

Spin up a local VM:

```sh
brew cask install vagrant
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

Specify your hosts in an inventory file called **hosts.yml** with the following contents:

```yaml
all:
  hosts:
    children:
      acceptance:
        vagrant
      production:
        production.com
```

Now you can run your ssh commands via:

```sh
ansible all -i hosts.yml -m ping
```

---

# Playbooks

---

# Roles
