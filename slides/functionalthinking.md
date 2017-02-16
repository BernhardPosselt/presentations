```java
List<String> findEmails(List<CustomerModel> customers) {
    List<String> result = new ArrayList<>();

    for (CustomerModel customer: customers) {
        String email = null;

        for (AddressModel address: customer.getAddresses()) {
            email = address.getEmail();
            if (email != null) {
                break;
            }
        }

        if (email == null) {
            LOG.info("Could not find email for " + customer.getName())
        } else {
            result.add(email);
        }
    }

    return result;
}
```

---

```java
List<String> findEmails(List<CustomerModel> customers) {
    List<String> result = new ArrayList<>();
    for (CustomerModel customer: customers) {
        String email = this.findEmail(customer);
        if (email == null) {
            LOG.info("No mail for " + customer.getName())
        } else {
            result.add(email);
        }
    }
    return result;
}

String findEmail(CustomerModel customer) {
    for (AddressModel address: customer.getAddresses()) {
        String email = address.getEmail();
        if (email != null) {
            return email;
        }
    }
    return null;
}
```

---

```java
List<String> findEmails(List<CustomerModel> customers) {
    Map<String, Optional<String>> emails = customers.stream()
        .collect(Collectors.toMap(c -> c.getUid(), findEmail(c)));

    emails.entrySet().stream()
        .filter(entry -> !entry.getValue().isPresent())
        .map(Map.Entry::getKey)
        .forEach(name -> LOG.info("No mail for " + name));

    return emails.values().stream()
        .flatMap(email -> email.stream())  // Java 9
        .collect(Collectors.toList());
}

Optional<String> findEmail (CustomerModel customer) {
    return customer.getAddresses().stream()
        .map(AddressModel::getEmail)
        .findFirst();
}
```

---

# Key Takeaways

* 2 iterations instead of 1
* Reduce data complexity: Easier to deal with simple data types
* No jumps (goto, break, return, continue): Reads from top to bottom
* No state: no temp variables and no mutation of references
* Logical separation instead of structural
 * Find customers with email
 * Log customers without email
