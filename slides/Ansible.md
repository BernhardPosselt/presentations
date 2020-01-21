class: center, middle

# Ansible

---

# Setup

Vagrant runs on local machine over ssh by default

    brew install ansible

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

# Running a Simple Test

Specify your hosts in an inventory file called **acceptance.yml** with the following contents:

```yaml
all:
  hosts:
    vagrant
```

Now you can run your ssh commands via:

```sh
ansible all -i acceptance.yml -m ping
```

---

# Playbooks

---

# Roles
