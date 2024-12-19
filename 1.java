public class ExampleSonarIssues {

    public static void main(String[] args) {
        ExampleSonarIssues obj = new ExampleSonarIssues();
        obj.unusedMethod();
        obj.methodWithTooManyParams(1, 2, 3, 4, 5, 6);
        obj.potentialNullPointerRisk();
    }

    // Issue 1: Unused method
    public void unusedMethod() {
        System.out.println("This method is never called.");
    }

    // Issue 2: Method with too many parameters (bad design)
    public void methodWithTooManyParams(int a, int b, int c, int d, int e, int f) {
        System.out.println("Too many parameters make this hard to maintain.");
    }

    // Issue 3: Hardcoded credentials (security risk)
    public void hardcodedPassword() {
        String password = "12345"; // Sensitive data hardcoded
        System.out.println("The password is: " + password);
    }

    // Issue 4: Potential NullPointerException
    public void potentialNullPointerRisk() {
        String riskyString = null;
        if (riskyString.length() > 5) { // This will throw a NullPointerException
            System.out.println("Risky string length: " + riskyString.length());
        }
    }

    // Issue 5: Commented-out code
    public void commentedCodeExample() {
        // System.out.println("This code is commented out and should be removed.");
    }

    // Issue 6: Inefficient string concatenation in a loop
    public void inefficientStringConcatenation() {
        String result = "";
        for (int i = 0; i < 10; i++) {
            result += i; // Inefficient use of string concatenation in a loop
        }
        System.out.println(result);
    }
}
