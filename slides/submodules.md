class: center, middle

# Managing Repositories Inside Repositories: Git Submodules

---

# Adding Submodules


```bash
git submodule add git@github.com:BernhardPosselt/submodule.git path/folder
```

Creates **.gitmodules**
```ini
[submodule "path/folder"]
	path = path/folder
	url = git@github.com:BernhardPosselt/submodule.git
```

and a **file!** in **path/folder** which only exists on your server and tracks the locked commit in your submodule:

```bash
Subproject commit 148e43d711a25451826740bf990cda7af80528c2
```

You need to commit and push these changes.

---


# Cloning Repos With Submodules

Add the **--recursive** flag:


```bash
git clone https://github.com/BernhardPosselt/submodule-parent --recursive
```

---


# Making Updates

A submodule is just a repo in a repo with a tracking commit. You can switch branches, create and make changes, push them to the submodule repo, etc.

```bash
cd path/folder
touch new_file
git add new_file
git commit -m "added new file"
git push origin master
```

Making commits or changing the branch inside the repo however updates the tracking commit which you need to commit in the outer repo:

```bash
git add path/folder
git commit -m "update submodule"
git push origin master
```

---

# Pulling Updates (1/2)

Pulling the newest code in the parent repo gives you the newest tracking commit, but does not update the submodule:

```bash
git pull --rebase origin master
git status

On branch master
Your branch is up-to-date with 'origin/master'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

	modified:   path/foldername (new commits)

no changes added to commit (use "git add" and/or "git commit -a")

git submodule update
```

---

# Pulling Updates (2/2)

```bash
git submodule update
```

Sets the submodule to its current tracking commit. If you did not commit a tracking commit after a change it will undo the change.

---

# Working With Submodules

If you do not touch a submodule:
* Make sure to always run **git submodule update** after pulling
* Make sure to not revert a tracking commit because you forgot to run **git submodule update**

If you touch a submodule:
* Commit and push the changes and branches as usual
* Commit and push the tracking commit in the parent repo
