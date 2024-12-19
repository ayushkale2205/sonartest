class ExampleSonarIssues:
    def __init__(self):
        self.password = "12345"  # Hardcoded sensitive information (security risk)

    def unused_function(self):
        # This function is never called, representing dead code
        print("This is an unused function.")

    def function_with_many_parameters(self, a, b, c, d, e, f):
        # Too many parameters make the code hard to maintain
        print(f"Received: {a}, {b}, {c}, {d}, {e}, {f}")

    def potential_divide_by_zero(self, divisor):
        # Possible division by zero without validation
        result = 100 / divisor
        print(f"Result i      s {result}")

    def inefficient_loop(self):
        # Inefficient string concatenation in a loop
        result = ""
        for i in range(10):
            result += str(i)
        print(result)

    def commented_out_code(self):
        # print("This code is commented out and should be removed.")
        pass

    def risky_variable(self):
        # Using a variable before checking if it's None
        risky_string = None
        if len(risky_string) > 5:  # This will throw a TypeError
            print("Risky string is long enough.")


# Instantiate the class and call methods to simulate code execution
example = ExampleSonarIssues()
example.function_with_many_parameters(1, 2, 3, 4, 5, 6)
example.potential_divide_by_zero(0)  # Deliberate divide-by-zero error
example.inefficient_loop()
example.risky_variable()
