def func(numbers):
    for x in numbers:
        yield x

numbers = [1, 2, 3]
for x in func(numbers):
    print(x, end='')
    del numbers[-1]
